# 🏰 The Trial Dungeon  
### A learning-first game designed to become a full RPG

---

## 🎯 Overview

**The Trial Dungeon** is a story-driven learning game where **knowledge is the only path forward**.  
Instead of points, streaks, or leaderboards, players earn **power, identity, and progression** by completing skill-based trials inside an immersive game world.

This project is a **mechanics-focused prototype** validating the core idea:

> *Learning should feel like becoming stronger — not completing a checklist.*

---

## 🧠 Problem

Most gamified learning platforms lose engagement after initial excitement because:

- Gamification is limited to points, streaks, and badges  
- Rewards become predictable and emotionally shallow  
- Overemphasis on competition discourages beginners  
- Skill growth is abstract and invisible  
- Learning effort is detached from identity and purpose  

Learners complete content — but don’t **feel** more capable.

---

## 💡 Solution

**The Trial Dungeon** reframes learning as a series of **Trials**:

- Players start powerless and are intentionally defeated  
- Guidance comes from in-world NPCs and Sages  
- Progression is gated by **skill mastery**, not time spent  
- Solution quality determines weapon strength and rewards  
- Learning never breaks immersion — it *is* the story  

Better thinking leads to stronger outcomes.

---

## 🔁 Core Gameplay Loop

1. Explore a dungeon-style map  
2. Encounter enemies, NPCs, and Sages  
3. Experience guided failure  
4. Accept a Sage Trial (skill challenge)  
5. Solve the trial (DSA in this prototype)  
6. Earn weapons based on solution quality  
7. Defeat enemies and restore balance  
8. Progress to higher-level trials  

---

## 🧙 Sages & Trials

- Sages are former scientists captured by hostile forces  
- Each Sage specializes in a skill domain  
- Trials may include:
  - Problem solving  
  - Optimization  
  - Bug detection  
  - Reasoning challenges  
- Hints are available but **reduce final weapon strength**  
- Mastery is always more rewarding than shortcuts  

---

## 📜 Scrolls, Pets & Identity

- Completed trials generate **scrolls** stored in a library  
- Scrolls represent knowledge earned, not time spent  
- Exceptional performance unlocks **pets** that persist with the player  
- Growth is visible, meaningful, and personal  

---

## ⚔️ Arena Trials (Concept)

- Shared trials instead of leaderboards  
- Cooperative or competitive formats  
- Rewards based on mastery, not rank  
- Rare pets and recognition for exceptional performance  

---

## 🎮 Prototype Scope

This prototype focuses on validating the **learning-to-progression loop**:

- One dungeon map  
- Player, NPC, Sage, enemy, and boss entities  
- Dialog system  
- Sage trial scene with mock DSA questions  
- Boss fight scene (skill-gated)  
- Web-based deployment  

Visuals are intentionally minimal to emphasize mechanics and immersion.

---

## 🧱 Tech Stack

### UI Layer
- React  
- Tailwind CSS  

### Game Logic Layer
- Phaser.js  
- Scene-based architecture  

### Build & Deployment
- Vite  
- GitHub Pages  

---

## 🚀 Running Locally

```bash
cd client
npm install
npm run dev
