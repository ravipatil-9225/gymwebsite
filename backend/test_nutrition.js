require('dotenv').config();
const fetch = require('node-fetch');

async function test() {
    console.log("Testing split Groq plan generation...");
    const start = Date.now();
    const res = await fetch('http://localhost:5000/api/nutrition/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Ravi', age: 25, gender: 'male',
            weight_kg: 75, height_cm: 175,
            goal: 'muscle_gain', activity_level: 'moderately_active',
            food_preference: 'non_vegetarian', cuisine_preference: 'Indian_first',
            fitness_level: 'intermediate', equipment_available: 'full_gym',
            sleep_hours_actual: 7, target_calories: 2800,
            bmi: 24.5, bmiCategory: 'normal',
            allergies: [], medical_conditions: [], injuries: []
        })
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const data = await res.json();
    if (!res.ok) { console.log(`❌ Error: ${data.message}`); return; }

    console.log(`✅ Done in ${elapsed}s`);
    console.log(`   Diet days: ${data.dietPlan?.length}`);
    console.log(`   Workout days: ${data.workoutPlan?.length}`);

    // Check each day has meals
    let emptyDays = 0;
    (data.dietPlan || []).forEach((day, i) => {
        const meals = day.meals || {};
        const hasItems = Object.values(meals).some(m => (m?.items||[]).length > 0);
        if (!hasItems) { console.log(`   ⚠️  Day ${i+1} (${day.date_label}) has NO meal items`); emptyDays++; }
        else console.log(`   ✓ Day ${i+1} (${day.date_label}): ${day.meals?.breakfast?.items?.[0]?.name || 'ok'}`);
    });
    if (emptyDays === 0) console.log('\n🎉 All 7 days have meal data — no empty days!');
    else console.log(`\n⚠️ ${emptyDays} day(s) still empty`);
}
test().catch(console.error);
