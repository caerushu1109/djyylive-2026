export const sportMonksWorldCupSample = {
  matches: [
    {
      id: 2026001,
      starting_at: "2026-06-19T20:00:00Z",
      state: "scheduled",
      name: "England vs Croatia",
      round: {
        name: "L组",
        sort_order: 21,
      },
      group: {
        name: "L",
      },
      participants: [
        {
          name: "England",
          meta: {
            location: "home",
          },
        },
        {
          name: "Croatia",
          meta: {
            location: "away",
          },
        },
      ],
      venue: {
        name: "Official FIFA venue",
        city_name: "New York",
        country_name: "United States",
      },
      time: {
        minute: null,
      },
    },
    {
      id: 2026002,
      starting_at: "2026-06-11T20:00:00Z",
      state: "live",
      name: "Mexico vs South Africa",
      round: {
        name: "A组",
        sort_order: 10,
      },
      group: {
        name: "A",
      },
      participants: [
        {
          name: "Mexico",
          meta: {
            location: "home",
          },
        },
        {
          name: "South Africa",
          meta: {
            location: "away",
          },
        },
      ],
      scores: [
        {
          description: "CURRENT",
          score: {
            participant: "home",
            goals: 1,
          },
        },
        {
          description: "CURRENT",
          score: {
            participant: "away",
            goals: 0,
          },
        },
      ],
      venue: {
        name: "Estadio Azteca",
        city_name: "Mexico City",
        country_name: "Mexico",
      },
      time: {
        minute: 67,
      },
    },
    {
      id: 2026003,
      starting_at: "2026-06-17T19:00:00Z",
      state: "ft",
      name: "France vs Senegal",
      round: {
        name: "I组",
        sort_order: 18,
      },
      group: {
        name: "I",
      },
      participants: [
        {
          name: "France",
          meta: {
            location: "home",
          },
        },
        {
          name: "Senegal",
          meta: {
            location: "away",
          },
        },
      ],
      scores: [
        {
          description: "CURRENT",
          score: {
            participant: "home",
            goals: 2,
          },
        },
        {
          description: "CURRENT",
          score: {
            participant: "away",
            goals: 1,
          },
        },
      ],
      venue: {
        name: "Official FIFA venue",
        city_name: "Los Angeles",
        country_name: "United States",
      },
      time: {
        minute: 90,
      },
    },
  ],
  standings: [
    {
      group: {
        name: "A",
      },
      participant: {
        name: "Mexico",
      },
      details: {
        played: 1,
        won: 1,
        draw: 0,
        lost: 0,
        goals_for: 1,
        goals_against: 0,
      },
      points: 3,
    },
    {
      group: {
        name: "A",
      },
      participant: {
        name: "South Africa",
      },
      details: {
        played: 1,
        won: 0,
        draw: 0,
        lost: 1,
        goals_for: 0,
        goals_against: 1,
      },
      points: 0,
    },
    {
      group: {
        name: "I",
      },
      participant: {
        name: "France",
      },
      details: {
        played: 1,
        won: 1,
        draw: 0,
        lost: 0,
        goals_for: 2,
        goals_against: 1,
      },
      points: 3,
    },
    {
      group: {
        name: "I",
      },
      participant: {
        name: "Senegal",
      },
      details: {
        played: 1,
        won: 0,
        draw: 0,
        lost: 1,
        goals_for: 1,
        goals_against: 2,
      },
      points: 0,
    },
  ],
  eventsByMatch: {
    2026002: [
      {
        id: 9001,
        minute: 18,
        type: {
          developer_name: "goal",
          name: "Goal",
        },
        participant: {
          name: "Mexico",
        },
        player: {
          name: "Santiago Gimenez",
        },
        detail: "Right-footed finish from inside the box",
      },
      {
        id: 9002,
        minute: 53,
        type: {
          developer_name: "yellow_card",
          name: "Yellow card",
        },
        participant: {
          name: "South Africa",
        },
        player: {
          name: "Teboho Mokoena",
        },
        detail: "Late challenge in midfield",
      },
    ],
    2026003: [
      {
        id: 9101,
        minute: 12,
        type: {
          developer_name: "goal",
          name: "Goal",
        },
        participant: {
          name: "France",
        },
        player: {
          name: "Kylian Mbappe",
        },
        detail: "First-time finish from close range",
      },
      {
        id: 9102,
        minute: 75,
        type: {
          developer_name: "substitution",
          name: "Substitution",
        },
        participant: {
          name: "Senegal",
        },
        player: {
          name: "Nicolas Jackson",
        },
        detail: "Attacking change chasing the equaliser",
      },
    ],
  },
  statsByMatch: {
    2026002: {
      possession: {
        home: 57,
        away: 43,
      },
      shots: {
        home: 15,
        away: 9,
      },
      shots_on_target: {
        home: 5,
        away: 3,
      },
      xg: {
        home: 1.6,
        away: 0.9,
      },
    },
    2026003: {
      possession: {
        home: 61,
        away: 39,
      },
      shots: {
        home: 16,
        away: 8,
      },
      shots_on_target: {
        home: 7,
        away: 2,
      },
      xg: {
        home: 1.8,
        away: 0.7,
      },
    },
  },
};
