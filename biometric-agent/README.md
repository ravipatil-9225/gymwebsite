# ZKTeco K40 Pro Local Biometric Agent Setup Guide

This lightweight service connects your physical **ZKTeco K40 Pro** biometric machine to your gym website cloud database for **real-time, zero-lag attendance marking**.

---

## 📋 Prerequisites
1. **Gym Reception PC** (Windows / Mac / Linux) connected to the same Wi-Fi router / LAN as the ZKTeco K40 Pro.
2. **Node.js** installed on the reception PC ([Download Node.js](https://nodejs.org/)).
3. **ZKTeco K40 Pro** machine powered ON and connected to the router via Ethernet cable or Wi-Fi.

---

## 🛠️ Step 1: Network Setup (Assign Static IP to K40 Pro)

On the **ZKTeco K40 Pro Machine**:
1. Press `M/OK` on the machine keypad to enter Menu.
2. Navigate to **Comm.** (Communication) -> **Network**.
3. Set IP Address to a fixed local IP:
   - **IP Address**: `192.168.1.201` (or any available IP on your router subnet)
   - **Subnet Mask**: `255.255.255.0`
   - **Gateway**: `192.168.1.1`
   - **Comm Key**: `0`
4. Press `M/OK` to save.

> 💡 **Test connection from reception PC**: Open Command Prompt (`cmd`) and run:
> ```cmd
> ping 192.168.1.201
> ```
> Ensure you get reply responses.

---

## 🔑 Step 2: Configure Environment Variables

1. Copy the `biometric-agent` folder to your Gym Reception PC.
2. Open `.env` (or copy `.env.example` to `.env`) and set:

```env
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
CLOUD_API_URL=https://your-gym-website-domain.com/api/attendance/biometric-punch
BIOMETRIC_BRIDGE_SECRET=gym_biometric_secret_2026
```

> ⚠️ Ensure `BIOMETRIC_BRIDGE_SECRET` matches your backend environment variable in `backend/.env`.

---

## 🚀 Step 3: Install & Start Agent

Open terminal/cmd in the `biometric-agent` folder:

```bash
# 1. Install dependencies
npm install

# 2. Start the agent
npm start
```

You will see:
```text
====================================================
⚡ ZKTeco K40 Pro Local Biometric Agent Initializing
📌 Machine IP   : 192.168.1.201:4370
☁️ Cloud Endpoint: https://your-gym-website-domain.com/api/attendance/biometric-punch
====================================================
⏳ Connecting to ZKTeco K40 Pro machine at 192.168.1.201:4370...
✅ Connected to ZKTeco K40 Pro device successfully!
📡 Real-time listener active. Ready for thumb scans!
```

---

## 🔄 Step 4: Run Automatically on Windows Startup (PM2)

To ensure the agent stays running 24/7 and restarts automatically if the PC reboots:

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Start agent with PM2
pm2 start agent.js --name "biometric-agent"

# 3. Save PM2 state for startup
pm2 save

# 4. Generate startup script
npx pm2-startup install
```

---

## 👤 Step 5: Link Members (Biometric User ID mapping)

1. When enrolling a member's fingerprint on the **K40 Pro machine**, note their numerical **User ID** (e.g. `1`, `2`, `15`).
2. Go to **Gym Website Admin -> User Management**.
3. Edit the member's profile and enter their **Biometric / Machine User ID** (e.g. `15`).
4. Save profile.

---

## 🧪 Testing real-time attendance

1. Ask Member #15 to place their thumb on the K40 Pro device.
2. Open the **Gym Website Admin Dashboard / Attendance page**.
3. Member #15 will immediately appear in the **Present** log with exact time and a green live indicator!
