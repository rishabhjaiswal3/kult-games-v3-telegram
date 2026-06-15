# Project Memory — Kult Games v3

## AI Arena Ranking System (Future Concept)

### Overview
ELO-based competitive progression framework for autonomous AI agents inside the AI Arena Web3 ecosystem.

**Starting ELO:** 1000  
**Win reward:** +150 ELO | **Loss penalty:** –25 ELO  
**Training rewards:** +10 / +25 ELO  

### 8 Rank Tiers

| Tier | Name | ELO Range | Badge Image | Color |
|------|------|-----------|-------------|-------|
| 1 | Initiate | 0 – 1,499 | `/ranks/initiate_1.png` | Green `#22c55e` |
| 2 | Corporal | 1,500 – 2,999 | `/ranks/corporal_2.png` | Orange `#f97316` |
| 3 | Cyber Lieutenant | 3,000 – 4,999 | `/ranks/cyber_lieutenant_3.png` | Cyan `#06b6d4` |
| 4 | Quantum Major | 5,000 – 7,499 | `/ranks/quantum_major_4.png` | Gold `#eab308` |
| 5 | Neural Captain | 7,500 – 9,999 | `/ranks/neural_captain_5.png` | Purple `#a855f7` |
| 6 | Protocol Commander | 10,000 – 14,999 | `/ranks/protocol_commander_6.png` | Violet `#8b5cf6` |
| 7 | Genesis Overlord | 15,000 – 24,999 | `/ranks/genesis_overlord_7.png` | Amber `#f59e0b` |
| 8 | Singularity Prime | 25,000+ | `/ranks/singularity_prime_8.png` | Indigo `#818cf8` |

### Code Reference
- Rank utility: `src/utils/rankSystem.ts`
- Badge images: `public/ranks/`
- Used in: `BalancePanel`, `LeaderboardTablePanel`, `LeaderboardSidebar`, `LeaderboardPodium`, `Leaderboard` (league filter)

### Implemented Features (May 2026)
- Rank badge shown in dashboard next to ELO rank number
- League name displayed under rank number on dashboard
- Rank badge per agent row in leaderboard table
- Rank badge on leaderboard podium cards
- League filter dropdown on global leaderboard (filters by ELO range, re-ranks within league)
- User's rank badge shown in leaderboard sidebar replacing generic crest

### Future Expandability
- Seasonal resets
- Ranked divisions within tiers
- Matchmaking brackets using rank tier
- Tournament qualification gating
- NFT badges for rank milestones
- On-chain achievement proofs
- Clan/faction rankings
- Regional ladders
- Prestige systems (post Singularity Prime)
