const Groq = require('groq-sdk');

// ── VALIDATORS ──────────────────────────────────────────────────────────────
function isDietComplete(dietPlan) {
    if (!Array.isArray(dietPlan) || dietPlan.length < 7) return false;
    return dietPlan.every(day => {
        const meals = day.meals || {};
        return Object.keys(meals).some(k => (meals[k]?.items || []).length > 0);
    });
}

function isWorkoutComplete(workoutPlan) {
    if (!Array.isArray(workoutPlan) || workoutPlan.length < 7) return false;
    return workoutPlan.every(day =>
        day.isRestDay || (Array.isArray(day.main_workout) && day.main_workout.length > 0)
    );
}

// Sanitise meal items: quantity must be a number, strip embedded units
function sanitiseDietData(data) {
    try {
        const plan = data?.dietPlan || [];
        plan.forEach(day => {
            const meals = day.meals || {};
            Object.values(meals).forEach(meal => {
                (meal?.items || []).forEach(item => {
                    if (typeof item.quantity === 'string') {
                        // e.g. "2 slices" → quantity=2, if unit is empty set it
                        const match = item.quantity.match(/^([0-9.]+)\s*(.*)$/);
                        if (match) {
                            item.quantity = parseFloat(match[1]) || 1;
                            if (!item.unit && match[2]) item.unit = match[2].trim();
                        } else {
                            item.quantity = 1;
                        }
                    }
                    // Coerce numeric fields
                    ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'].forEach(f => {
                        if (typeof item[f] === 'string') item[f] = parseFloat(item[f]) || 0;
                    });
                });
            });
        });
    } catch (_) { }
    return data;
}

// ── GROQ CALLER ─────────────────────────────────────────────────────────────
// No response_format: json_object — Groq's strict validator rejects values like
// "quantity": 2 slices. We extract JSON from the text ourselves instead.
async function callGroq(groq, systemPrompt, userPrompt) {
    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4500,
        response_format: { type: "json_object" }
    });
    const text = (completion.choices[0]?.message?.content || '').trim();
    // Extract first complete JSON object from the response
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1) throw new Error('No JSON object found in AI response');
    const jsonStr = text.substring(first, last + 1);
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        throw new Error('AI returned invalid JSON structure: ' + e.message);
    }
}

const generatePlan = async (req, res) => {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: 'GROQ_API_KEY is not configured in .env' });
        }

        const p = req.body;
        const groq = new Groq({ apiKey });

        // ── LOOKUP TABLES ──────────────────────────────────────────────────
        const macroMap = {
            muscle_gain: '40% protein / 35% carbs / 25% fat',
            weight_loss: '30% protein / 40% carbs / 30% fat',
            weight_gain: '25% protein / 50% carbs / 25% fat',
            maintenance: '25% protein / 45% carbs / 30% fat',
            endurance: '25% protein / 55% carbs / 20% fat',
            flexibility: '25% protein / 45% carbs / 30% fat',
        };

        const splitMap = {
            muscle_gain: 'Mon=Push, Tue=Pull, Wed=Legs, Thu=REST, Fri=Push, Sat=Pull, Sun=REST',
            weight_loss: 'Mon=Full-body, Tue=Cardio, Wed=Full-body, Thu=REST, Fri=HIIT, Sat=Cardio, Sun=REST',
            maintenance: 'Mon=Upper, Tue=Lower, Wed=Cardio, Thu=REST, Fri=Full-body, Sat=Flex, Sun=REST',
            endurance: 'Mon=Run, Tue=Cross-train, Wed=Run, Thu=REST, Fri=Long Run, Sat=Strength, Sun=REST',
        };

        const foodRules = {
            vegetarian: 'NO meat, fish, eggs',
            vegan: 'NO meat, fish, eggs, dairy, honey',
            eggetarian: 'NO meat, fish — eggs OK',
            jain: 'NO meat, fish, eggs, onion, garlic, potato',
            non_vegetarian: 'All foods OK',
        };

        const cuisine = p.cuisine_preference === 'Indian_first'
            ? 'Indian: dal, roti, rice, idli, dosa, poha, upma, khichdi, rajma, chole, paneer, sabzi'
            : 'Global variety';

        const fitRules = { beginner: '2-3 sets 90s rest light weights', intermediate: '3-4 sets 60s rest moderate', advanced: '4-5 sets 45s rest heavy' }[p.fitness_level] || '3 sets 60s rest';
        const equipRule = { full_gym: 'Full gym (barbells cables machines dumbbells)', dumbbells: 'Dumbbells only', resistance_bands: 'Bands only', none: 'Bodyweight only' }[p.equipment_available] || 'Full gym';
        const bmiRule = p.bmiCategory === 'obese' ? 'LOW IMPACT only no jumping no sprinting' : 'Normal intensity OK';

        // ── CALORIE SPLITS ─────────────────────────────────────────────────
        const bCal = Math.round(p.target_calories * 0.25);
        const mCal = Math.round(p.target_calories * 0.10);
        const lCal = Math.round(p.target_calories * 0.35);
        const eCal = Math.round(p.target_calories * 0.10);
        const dCal = Math.round(p.target_calories * 0.20);
        const waterL = ((35 * p.weight_kg + 700) / 1000).toFixed(1);

        const userCtx = `Name:${p.name} Age:${p.age} Gender:${p.gender} Weight:${p.weight_kg}kg Height:${p.height_cm}cm Goal:${p.goal} Calories:${p.target_calories}/day Macros:${macroMap[p.goal]} Diet:${p.food_preference}(${foodRules[p.food_preference]}) Cuisine:${cuisine} Allergies:${p.allergies?.join(',') || 'none'} Injuries:${p.injuries?.join(',') || 'none'} Medical:${p.medical_conditions?.join(',') || 'none'}`;

        // ── DIET PROMPT ────────────────────────────────────────────────────
        // CRITICAL: quantity MUST be a plain number (e.g. 2, 100, 0.5)
        // Put the unit string in the "unit" field (e.g. "slices", "g", "oz", "tbsp", "bowl")
        const dietPrompt = `You are a nutrition planner. Output ONLY raw JSON — no markdown, no explanation.

${userCtx}
Meal calorie targets: breakfast=${bCal}kcal midMorning=${mCal}kcal lunch=${lCal}kcal eveningSnack=${eCal}kcal dinner=${dCal}kcal

IMPORTANT JSON RULES:
- "quantity" must be a NUMBER only. Examples: 2, 100, 0.5, 30. NEVER write "2 slices" or "120g" or "1 oz".
- Put the unit in the "unit" field as a string. Examples: "slices", "g", "oz", "tbsp", "bowl", "piece", "cup".
- All numeric fields (calories, protein_g, carbs_g, fat_g, fiber_g) must be numbers not strings.

Output this exact JSON structure with all 7 days filled:
{
  "macroTargets": {"daily_calories":${p.target_calories},"protein_g":150,"carbs_g":200,"fat_g":70,"fiber_g":30},
  "dietPlan": [
    {
      "day":"Day 1","date_label":"Monday","total_calories":${p.target_calories},
      "meals":{
        "breakfast":{"time":"7:30 AM","items":[{"name":"Oats","quantity":80,"unit":"g","calories":300,"protein_g":10,"carbs_g":55,"fat_g":5,"fiber_g":8,"preparation_tip":"Cook with milk"}],"meal_total_calories":${bCal}},
        "midMorning":{"time":"10:30 AM","items":[{"name":"Banana","quantity":1,"unit":"piece","calories":${mCal},"protein_g":1,"carbs_g":25,"fat_g":0,"fiber_g":3,"preparation_tip":"Eat fresh"}],"meal_total_calories":${mCal}},
        "lunch":{"time":"1:00 PM","items":[{"name":"Dal Tadka","quantity":200,"unit":"g","calories":${lCal},"protein_g":15,"carbs_g":60,"fat_g":8,"fiber_g":10,"preparation_tip":"Serve with roti"}],"meal_total_calories":${lCal}},
        "eveningSnack":{"time":"4:30 PM","items":[{"name":"Mixed Nuts","quantity":30,"unit":"g","calories":${eCal},"protein_g":5,"carbs_g":8,"fat_g":14,"fiber_g":2,"preparation_tip":"Unsalted"}],"meal_total_calories":${eCal}},
        "dinner":{"time":"8:00 PM","items":[{"name":"Chicken Curry","quantity":200,"unit":"g","calories":${dCal},"protein_g":30,"carbs_g":20,"fat_g":12,"fiber_g":4,"preparation_tip":"Serve with rice"}],"meal_total_calories":${dCal}}
      }
    },
    (repeat for Day 2 Tuesday through Day 7 Sunday — different meals each day, honor all food restrictions and allergies)
  ],
  "hydration":{"daily_water_liters":${waterL},"hydration_tips":["Drink 500ml on waking","Carry 1L bottle always","200ml before each meal"]},
  "supplementSuggestions":[{"name":"Whey Protein","purpose":"Meet protein target","recommended_dose":"25g","best_timing":"Post-workout","disclaimer":"Consult doctor before use"}],
  "weeklySummary":{"goal_alignment_note":"Plan designed for ${p.goal}","top_3_tips":["Be consistent with meal timings","Track macros daily","Prioritise sleep for recovery"]}
}`;

        // ── WORKOUT PROMPT ─────────────────────────────────────────────────
        const workoutPrompt = `You are a fitness coach. Output ONLY raw JSON — no markdown, no explanation.

${userCtx}
Fitness:${p.fitness_level}(${fitRules}) Equipment:${equipRule} BMI:${bmiRule}
Split: ${splitMap[p.goal] || splitMap.maintenance}

IMPORTANT JSON RULES:
- "sets" and "reps" must be numbers (e.g. 3, 10, 12). Never strings.
- "rest_seconds" must be a number (e.g. 60, 90).
- "duration_seconds" must be a number.

Output this exact JSON with all 7 days:
{
  "workoutPlan": [
    {"day":"Day 1","date_label":"Monday","type":"Push","focus":"Chest Shoulders Triceps","total_duration_minutes":60,"isRestDay":false,
     "warm_up":[{"name":"Jumping Jacks","duration_seconds":60,"instruction":"30 reps full body"},{"name":"Arm Circles","duration_seconds":30,"instruction":"10 each direction"},{"name":"Dynamic Chest Stretch","duration_seconds":30,"instruction":"Swing arms across body"}],
     "main_workout":[
       {"name":"Bench Press","sets":4,"reps":10,"rest_seconds":60,"muscle_group":"chest","equipment":"barbell","instruction":"Lower to chest press up","modification":"Use dumbbells"},
       {"name":"Shoulder Press","sets":3,"reps":12,"rest_seconds":60,"muscle_group":"shoulders","equipment":"dumbbells","instruction":"Press overhead","modification":"Seated variation"},
       {"name":"Incline Dumbbell Press","sets":3,"reps":12,"rest_seconds":60,"muscle_group":"upper chest","equipment":"dumbbells","instruction":"30 degree incline","modification":"Flat bench"},
       {"name":"Lateral Raises","sets":3,"reps":15,"rest_seconds":45,"muscle_group":"side delts","equipment":"dumbbells","instruction":"Raise to shoulder height","modification":"Lighter weight"},
       {"name":"Tricep Dips","sets":3,"reps":12,"rest_seconds":60,"muscle_group":"triceps","equipment":"bench","instruction":"Lower body between bars","modification":"Bend knees"}
     ],
     "cool_down":[{"name":"Chest Stretch","duration_seconds":30,"instruction":"Doorway stretch"},{"name":"Shoulder Stretch","duration_seconds":30,"instruction":"Cross arm across chest"},{"name":"Tricep Stretch","duration_seconds":30,"instruction":"Arm behind head"}]
    },
    {"day":"Day 2","date_label":"Tuesday","type":"Pull","focus":"Back Biceps","total_duration_minutes":60,"isRestDay":false,"warm_up":[...],"main_workout":[5 exercises],"cool_down":[3 stretches]},
    {"day":"Day 3","date_label":"Wednesday","type":"Legs","focus":"Quads Hamstrings Glutes","total_duration_minutes":60,"isRestDay":false,"warm_up":[...],"main_workout":[5 exercises],"cool_down":[3 stretches]},
    {"day":"Day 4","date_label":"Thursday","isRestDay":true,"active_recovery":["Light walk 20 min","Foam rolling 15 min"]},
    {"day":"Day 5","date_label":"Friday","type":"Push","focus":"Chest Shoulders variation","total_duration_minutes":60,"isRestDay":false,"warm_up":[...],"main_workout":[5 exercises],"cool_down":[3 stretches]},
    {"day":"Day 6","date_label":"Saturday","type":"Pull","focus":"Back Biceps variation","total_duration_minutes":60,"isRestDay":false,"warm_up":[...],"main_workout":[5 exercises],"cool_down":[3 stretches]},
    {"day":"Day 7","date_label":"Sunday","isRestDay":true,"active_recovery":["Yoga 20 min","Light stretching"]}
  ],
  "sleepAndRecovery":{"recommended_sleep_hours":${p.goal === 'muscle_gain' ? 8 : 7},"current_sleep_hours":${p.sleep_hours_actual},"sleep_tips":["Consistent sleep schedule","Avoid screens 1hr before bed","Keep room cool and dark"]},
  "weeklyProgressTracker":{"metrics_to_track":[{"metric_name":"Body Weight","unit":"kg","goal_direction":"${p.goal === 'weight_loss' ? 'decrease' : 'increase'}"}],"top_milestones":["Complete all 5 workouts in week 1","Increase weight or reps by week 4","Visible progress by week 8"]}
}
Fill all [...] placeholders with real exercises/stretches following the user fitness level and equipment rules.`;

        // ── CONDITIONAL CALLS ──────────────────────────────────────────────
        const runDiet = p.plan_type === 'both' || p.plan_type === 'diet';
        const runWorkout = p.plan_type === 'both' || p.plan_type === 'workout';

        console.log(`🚀 Firing API calls... diet=${runDiet}, workout=${runWorkout}`);
        const startTime = Date.now();

        let dietResult = { status: 'rejected', reason: new Error('Not executed') };
        let workoutResult = { status: 'rejected', reason: new Error('Not executed') };

        if (runDiet) {
            try {
                const dietData = await callGroq(groq, 'You are a nutrition planner. Output ONLY raw JSON. No markdown code blocks. No explanation text.', dietPrompt);
                dietResult = { status: 'fulfilled', value: dietData };
            } catch (err) {
                dietResult = { status: 'rejected', reason: err };
            }
        } else {
            dietResult = { status: 'fulfilled', value: null };
        }

        if (runWorkout) {
            try {
                const workoutData = await callGroq(groq, 'You are a fitness coach. Output ONLY raw JSON. No markdown code blocks. No explanation text.', workoutPrompt);
                workoutResult = { status: 'fulfilled', value: workoutData };
            } catch (err) {
                workoutResult = { status: 'rejected', reason: err };
            }
        } else {
            workoutResult = { status: 'fulfilled', value: null };
        }

        console.log(`⏱ Groq responded in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

        // ── ERROR HANDLING ─────────────────────────────────────────────────
        if (runDiet && dietResult.status === 'rejected') {
            const err = dietResult.reason;
            console.error('❌ Diet call failed:', (err?.message || '').substring(0, 300));
            const msg = err?.message || '';
            if (err?.status === 429 || msg.includes('rate_limit'))
                return res.status(429).json({ message: 'Rate limit reached. Please wait 30 seconds and try again.' });
            
            // If they only asked for diet, error out. If 'both', maybe we still return workout? Let's just error out for consistency.
            if (p.plan_type === 'diet' || p.plan_type === 'both') {
                return res.status(500).json({ message: 'Diet plan generation failed. ' + msg, error: msg });
            }
        }

        if (runWorkout && workoutResult.status === 'rejected') {
            const err = workoutResult.reason;
            console.error('❌ Workout call failed:', (err?.message || '').substring(0, 200));
            const msg = err?.message || '';
            
            // Error out if they ONLY wanted workout, or if it failed and we wanted both (optional, but let's be strict if they only want workout)
            if (p.plan_type === 'workout') {
                if (err?.status === 429 || msg.includes('rate_limit'))
                    return res.status(429).json({ message: 'Rate limit reached. Please wait 30 seconds and try again.' });
                return res.status(500).json({ message: 'Workout plan generation failed. ' + msg, error: msg });
            }
        }

        const dietData = runDiet && dietResult.status === 'fulfilled' ? sanitiseDietData(dietResult.value) : null;
        const workoutData = runWorkout && workoutResult.status === 'fulfilled' ? workoutResult.value : null;

        console.log(`✅ dietOk=${isDietComplete(dietData?.dietPlan)}, workoutOk=${isWorkoutComplete(workoutData?.workoutPlan)}, days=${dietData?.dietPlan?.length}`);

        // ── MERGE & RETURN ─────────────────────────────────────────────────
        res.json({
            planMeta: {
                generatedFor: p.name, age: p.age, gender: p.gender,
                weight_kg: p.weight_kg, height_cm: p.height_cm,
                bmi: p.bmi, bmiCategory: p.bmiCategory,
                goal: p.goal, fitnessLevel: p.fitness_level,
                activityLevel: p.activity_level, equipment: p.equipment_available,
                caloriesTarget: p.target_calories, planDurationDays: 7,
                generatedBy: 'SmartNutrition Hub — Powered by Groq AI',
                safetyNotice: 'AI-generated plan for informational purposes only. Consult a certified healthcare professional before changing your diet or exercise routine.'
            },
            macroTargets: dietData?.macroTargets || {},
            dietPlan: dietData?.dietPlan || [],
            workoutPlan: workoutData?.workoutPlan || [],
            hydration: dietData?.hydration || {},
            sleepAndRecovery: workoutData?.sleepAndRecovery || {},
            weeklyProgressTracker: workoutData?.weeklyProgressTracker || {},
            supplementSuggestions: dietData?.supplementSuggestions || [],
            weeklySummary: dietData?.weeklySummary || {}
        });

    } catch (error) {
        console.error('Nutrition Error:', error.message);
        if (error.message?.includes('429') || error.message?.includes('rate_limit')) {
            return res.status(429).json({ message: 'Rate limit reached. Please wait a moment.', error: 'RATE_LIMIT' });
        }
        res.status(500).json({ message: 'Error generating plan. Please try again.', error: error.message });
    }
};

module.exports = { generatePlan };
