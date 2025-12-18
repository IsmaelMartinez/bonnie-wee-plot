/**
 * Comprehensive vegetable database for the Garden Planner
 * Planting times adjusted for Scotland / Edinburgh climate
 * (Last frost ~late April/early May, first frost ~late September/October)
 */

import { Vegetable, VegetableCategory } from '@/types/garden-planner'

export const vegetables: Vegetable[] = [
  // ============ LEAFY GREENS ============
  {
    id: 'lettuce',
    name: 'Lettuce',
    category: 'leafy-greens',
    description: 'Fast-growing salad crop. Start indoors in Scotland for earlier harvest.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7, 8],
      transplantMonths: [5, 6, 7, 8],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 45, max: 75 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 25, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sow little and often for continuous harvest',
        'Scottish summers rarely cause bolting - bonus!',
        'Harvest outer leaves for cut-and-come-again'
      ]
    },
    companionPlants: ['Carrots', 'Radishes', 'Strawberries', 'Chives'],
    avoidPlants: []
  },
  {
    id: 'spinach',
    name: 'Spinach',
    category: 'leafy-greens',
    description: 'Nutritious leafy green. Thrives in cool Scottish climate.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 8, 9],
      transplantMonths: [5, 6],
      harvestMonths: [5, 6, 7, 8, 10, 11],
      daysToHarvest: { min: 40, max: 50 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Perfect for Scottish climate - rarely bolts',
        'Autumn sowings can overwinter with protection',
        'Pick outer leaves regularly'
      ]
    },
    companionPlants: ['Strawberries', 'Peas', 'Beans'],
    avoidPlants: []
  },
  {
    id: 'perpetual-spinach',
    name: 'Perpetual Spinach',
    category: 'leafy-greens',
    description: 'Hardy leaf beet that survives Scottish winters. Cut-and-come-again.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 50, max: 60 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 30, rows: 40 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Survives Scottish winters with minimal protection',
        'Pick regularly to prevent bolting',
        'One of the most productive greens for Scotland'
      ]
    },
    companionPlants: ['Beans', 'Brassicas', 'Onions'],
    avoidPlants: []
  },
  {
    id: 'kale',
    name: 'Kale',
    category: 'leafy-greens',
    description: 'Hardy winter green - a Scottish staple! Improves after frost.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [6, 7, 8],
      harvestMonths: [9, 10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 55, max: 75 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Frost sweetens the leaves - perfect for Scotland',
        'Harvest lower leaves first',
        'Net against pigeons'
      ]
    },
    companionPlants: ['Beetroot', 'Celery', 'Onions', 'Potatoes'],
    avoidPlants: ['Strawberries', 'Tomatoes']
  },
  {
    id: 'chard',
    name: 'Swiss Chard',
    category: 'leafy-greens',
    description: 'Colorful, productive leafy green with edible stems. Hardy in mild winters.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [6, 7],
      harvestMonths: [7, 8, 9, 10, 11],
      daysToHarvest: { min: 50, max: 60 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 30, rows: 45 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Cut-and-come-again harvesting',
        'Rainbow varieties brighten Scottish gardens',
        'May overwinter in sheltered spots'
      ]
    },
    companionPlants: ['Beans', 'Brassicas', 'Onions'],
    avoidPlants: []
  },
  {
    id: 'rocket',
    name: 'Rocket (Arugula)',
    category: 'leafy-greens',
    description: 'Peppery salad leaf that grows quickly. Less likely to bolt in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7, 8, 9],
      transplantMonths: [],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 21, max: 40 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Wild rocket is hardier than salad rocket',
        'Sow every 3 weeks for continuous harvest',
        'Pick leaves young for milder flavor'
      ]
    },
    companionPlants: ['Bush beans', 'Beets', 'Carrots', 'Lettuce'],
    avoidPlants: []
  },
  {
    id: 'claytonia',
    name: 'Claytonia (Miners Lettuce)',
    category: 'leafy-greens',
    description: 'Hardy winter salad leaf, perfect for Scottish conditions.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 8, 9],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3, 4, 5],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'One of the hardiest winter salads',
        'Self-seeds freely once established',
        'Excellent for shady spots'
      ]
    },
    companionPlants: ['Lettuce', 'Spinach'],
    avoidPlants: []
  },
  {
    id: 'land-cress',
    name: 'Land Cress',
    category: 'leafy-greens',
    description: 'Peppery like watercress but grows in soil. Very hardy.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5, 8, 9],
      transplantMonths: [],
      harvestMonths: [5, 6, 10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'partial-shade',
      water: 'high',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Tastes like watercress without needing water',
        'Thrives in cooler Scottish temperatures',
        'Harvest outer leaves regularly'
      ]
    },
    companionPlants: ['Lettuce', 'Radishes'],
    avoidPlants: []
  },

  // ============ ROOT VEGETABLES ============
  {
    id: 'carrots',
    name: 'Carrots',
    category: 'root-vegetables',
    description: 'Sweet root vegetable. Sow later in Scotland after soil warms.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6, 7],
      transplantMonths: [],
      harvestMonths: [7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 70, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 5, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Wait until soil warms to 7°C',
        'Cover with fleece against carrot fly',
        'Can leave in ground and harvest through winter'
      ]
    },
    companionPlants: ['Onions', 'Leeks', 'Rosemary', 'Sage'],
    avoidPlants: ['Dill', 'Parsnips']
  },
  {
    id: 'potatoes',
    name: 'Potatoes (Tatties)',
    category: 'root-vegetables',
    description: 'Scottish staple! Plant after last frost risk around late April.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 70, max: 140 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 30, rows: 60 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Chit from February in a cool light place',
        'Plant after last frost (late April in Edinburgh)',
        'Watch for blight - common in wet Scottish summers'
      ]
    },
    companionPlants: ['Beans', 'Cabbage', 'Horseradish'],
    avoidPlants: ['Tomatoes', 'Cucumbers', 'Squash']
  },
  {
    id: 'beetroot',
    name: 'Beetroot',
    category: 'root-vegetables',
    description: 'Versatile root vegetable. Wait for warmer soil in Scotland.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [5, 6],
      harvestMonths: [7, 8, 9, 10, 11],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Soak seeds before sowing',
        'Bolt-resistant varieties best for Scotland',
        'Harvest young for tender roots'
      ]
    },
    companionPlants: ['Onions', 'Brassicas', 'Lettuce'],
    avoidPlants: ['Runner beans']
  },
  {
    id: 'parsnips',
    name: 'Parsnips',
    category: 'root-vegetables',
    description: 'Sweet winter root. Frost improves flavor - perfect for Scotland!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 5],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 100, max: 130 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Use fresh seed each year - viability drops fast',
        'Be patient - can take 4 weeks to germinate',
        'Leave in ground until after frost for sweetest flavor'
      ]
    },
    companionPlants: ['Onions', 'Garlic', 'Radishes'],
    avoidPlants: ['Carrots', 'Celery']
  },
  {
    id: 'swede',
    name: 'Swede (Neeps)',
    category: 'root-vegetables',
    description: 'Essential for Burns Night! Hardy Scottish favorite that loves cool weather.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 23, rows: 38 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Essential for Burns Night neeps & tatties!',
        'Frost sweetens the roots',
        'Can leave in ground all winter'
      ]
    },
    companionPlants: ['Peas', 'Beans', 'Onions'],
    avoidPlants: ['Potatoes', 'Other brassicas nearby']
  },
  {
    id: 'turnips',
    name: 'Turnips',
    category: 'root-vegetables',
    description: 'Fast-growing root with edible greens. Best harvested young.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 7, 8],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 10, 11],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Harvest when golf ball sized',
        'Young leaves are edible (turnip tops)',
        'Quick maturing varieties best for short season'
      ]
    },
    companionPlants: ['Peas', 'Beans'],
    avoidPlants: ['Potatoes']
  },
  {
    id: 'radishes',
    name: 'Radishes',
    category: 'root-vegetables',
    description: 'Quick-growing root crop. Ready in weeks - ideal for Scottish summer.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 6, 7, 8, 9],
      transplantMonths: [],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 25, max: 35 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 3, rows: 15 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Harvest promptly to avoid woodiness',
        'Great for intercropping',
        'Less likely to bolt in cool Scottish weather'
      ]
    },
    companionPlants: ['Carrots', 'Lettuce', 'Peas', 'Spinach'],
    avoidPlants: ['Hyssop']
  },
  {
    id: 'salsify',
    name: 'Salsify',
    category: 'root-vegetables',
    description: 'Oyster-flavored root vegetable. Hardy and underrated!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 30 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Subtle oyster-like flavor',
        'Frost improves flavor',
        'Leave in ground through winter'
      ]
    },
    companionPlants: ['Carrots', 'Onions'],
    avoidPlants: []
  },

  // ============ BRASSICAS ============
  {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'brassicas',
    description: 'Classic vegetable. Spring and winter varieties excellent for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4, 5],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6, 7],
      harvestMonths: [7, 8, 9, 10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 70, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Net against pigeons - they love it!',
        'Firm soil well when transplanting',
        'Collar against cabbage root fly'
      ]
    },
    companionPlants: ['Beetroot', 'Celery', 'Onions', 'Potatoes'],
    avoidPlants: ['Strawberries', 'Tomatoes']
  },
  {
    id: 'broccoli',
    name: 'Calabrese (Broccoli)',
    category: 'brassicas',
    description: 'Quick maturing broccoli. Start indoors for best results in Scotland.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 7],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Start early indoors for longer season',
        'Cut main head to encourage side shoots',
        'Net against cabbage white butterflies'
      ]
    },
    companionPlants: ['Beetroot', 'Celery', 'Onions', 'Potatoes'],
    avoidPlants: ['Strawberries', 'Tomatoes']
  },
  {
    id: 'purple-sprouting-broccoli',
    name: 'Purple Sprouting Broccoli',
    category: 'brassicas',
    description: 'Hardy winter broccoli - harvests when little else is available!',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [5],
      transplantMonths: [6, 7],
      harvestMonths: [2, 3, 4, 5],
      daysToHarvest: { min: 220, max: 280 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 75 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Perfect for hungry gap (Feb-April)',
        'Very hardy - survives Scottish winters',
        'Stake plants as they get tall'
      ]
    },
    companionPlants: ['Beetroot', 'Onions', 'Potatoes'],
    avoidPlants: ['Strawberries', 'Tomatoes']
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    category: 'brassicas',
    description: 'Demanding but rewarding. Choose varieties suited to Scotland.',
    planting: {
      sowIndoorsMonths: [2, 3, 4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 7],
      harvestMonths: [7, 8, 9, 10, 11],
      daysToHarvest: { min: 80, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 60, rows: 60 },
      depth: 1,
      difficulty: 'advanced',
      tips: [
        'Consistent watering crucial',
        'Bend leaves over curd to protect',
        'Autumn/winter varieties more reliable in Scotland'
      ]
    },
    companionPlants: ['Beetroot', 'Celery', 'Beans'],
    avoidPlants: ['Strawberries', 'Tomatoes']
  },
  {
    id: 'brussels-sprouts',
    name: 'Brussels Sprouts',
    category: 'brassicas',
    description: 'Christmas dinner essential! Improves after frost.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 150, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 75 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Frost sweetens the sprouts',
        'Stake tall plants against Scottish winds',
        'Harvest from bottom up'
      ]
    },
    companionPlants: ['Beetroot', 'Carrots', 'Onions'],
    avoidPlants: ['Strawberries', 'Tomatoes']
  },

  // ============ LEGUMES ============
  {
    id: 'runner-beans',
    name: 'Runner Beans',
    category: 'legumes',
    description: 'Prolific climbing bean. Wait until after last frost in late May.',
    planting: {
      sowIndoorsMonths: [5],
      sowOutdoorsMonths: [6],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 60, max: 75 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 15, rows: 60 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Frost tender - wait until June to plant out',
        'Need sturdy supports for Scottish winds',
        'Pick regularly for more beans'
      ]
    },
    companionPlants: ['Carrots', 'Squash', 'Cabbage'],
    avoidPlants: ['Onions', 'Garlic', 'Fennel']
  },
  {
    id: 'french-beans',
    name: 'French Beans',
    category: 'legumes',
    description: 'Bush or climbing beans. Start indoors in Scotland.',
    planting: {
      sowIndoorsMonths: [5],
      sowOutdoorsMonths: [6],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 55, max: 65 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 10, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Bush varieties need no support',
        'Start indoors for longer harvest window',
        'Harvest when pencil thin'
      ]
    },
    companionPlants: ['Carrots', 'Cucumber', 'Cabbage'],
    avoidPlants: ['Onions', 'Garlic']
  },
  {
    id: 'broad-beans',
    name: 'Broad Beans',
    category: 'legumes',
    description: 'Hardy beans - can be autumn sown in Scotland for early crop!',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [3, 4, 10, 11],
      transplantMonths: [],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 80, max: 100 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 45 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Autumn sowing gives earlier crop',
        'Very hardy - survives Scottish winters',
        'Pinch out tips when first pods form'
      ]
    },
    companionPlants: ['Brassicas', 'Carrots', 'Celery', 'Potatoes'],
    avoidPlants: ['Onions', 'Garlic']
  },
  {
    id: 'peas',
    name: 'Peas',
    category: 'legumes',
    description: 'Sweet garden peas. Cool Scottish summer is perfect for them!',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5, 6],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 5, rows: 60 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Peas love Scottish weather!',
        'Sow in guttering for easy planting out',
        'Provide support for climbing'
      ]
    },
    companionPlants: ['Carrots', 'Radishes', 'Turnips'],
    avoidPlants: ['Onions', 'Garlic']
  },

  // ============ SOLANACEAE ============
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    category: 'solanaceae',
    description: 'Best under cover in Scotland. Choose blight-resistant varieties.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 60, max: 85 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 45, rows: 60 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Greenhouse or polytunnel recommended',
        'Choose blight-resistant varieties for outdoors',
        'Outdoor bush varieties like Tumbler can work'
      ]
    },
    companionPlants: ['Basil', 'Carrots', 'Marigolds'],
    avoidPlants: ['Fennel', 'Brassicas']
  },
  {
    id: 'peppers',
    name: 'Sweet Peppers',
    category: 'solanaceae',
    description: 'Colorful bell peppers. Need greenhouse in Scotland.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 45 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Greenhouse essential in Scotland',
        'Start very early indoors',
        'Pinch growing tip for bushier plants'
      ]
    },
    companionPlants: ['Tomatoes', 'Basil', 'Carrots'],
    avoidPlants: ['Fennel', 'Beans']
  },
  {
    id: 'chillies',
    name: 'Chillies',
    category: 'solanaceae',
    description: 'Hot peppers. Grow in pots on sunny windowsill or greenhouse.',
    planting: {
      sowIndoorsMonths: [1, 2, 3],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 70, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 40, rows: 40 },
      depth: 1,
      difficulty: 'intermediate',
      tips: [
        'Start very early (January) for Scotland',
        'Windowsill or greenhouse growing',
        'Smaller varieties work well in pots'
      ]
    },
    companionPlants: ['Tomatoes', 'Basil', 'Carrots'],
    avoidPlants: ['Fennel']
  },

  // ============ CUCURBITS ============
  {
    id: 'courgettes',
    name: 'Courgettes (Zucchini)',
    category: 'cucurbits',
    description: 'Prolific summer squash. Start indoors and plant out after frost.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 45, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 90, rows: 90 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Frost tender - harden off well',
        'Pick when 10-15cm long',
        'One or two plants is enough!'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums', 'Radishes'],
    avoidPlants: ['Potatoes']
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'cucurbits',
    description: 'Best under cover in Scotland. Ridge cucumbers hardier outdoors.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 50, max: 70 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 45, rows: 90 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Greenhouse cucumbers give best results',
        'Ridge types can grow outdoors with protection',
        'Keep consistently watered'
      ]
    },
    companionPlants: ['Beans', 'Peas', 'Radishes'],
    avoidPlants: ['Potatoes', 'Aromatic herbs']
  },
  {
    id: 'squash',
    name: 'Winter Squash',
    category: 'cucurbits',
    description: 'Includes butternut, crown prince. Start indoors for Scotland.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 85, max: 110 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 90, rows: 120 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Choose shorter-season varieties (Crown Prince)',
        'Harden off well before planting out',
        'Cure in any late sunshine before storing'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums'],
    avoidPlants: ['Potatoes']
  },
  {
    id: 'pumpkin',
    name: 'Pumpkin',
    category: 'cucurbits',
    description: 'Traditional autumn favourite. Need warm start indoors.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 90, max: 120 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 120, rows: 180 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Choose smaller varieties for reliability',
        'Need sheltered sunny spot',
        'Cut with stem attached for storage'
      ]
    },
    companionPlants: ['Beans', 'Nasturtiums'],
    avoidPlants: ['Potatoes']
  },

  // ============ ALLIUMS ============
  {
    id: 'onions',
    name: 'Onions',
    category: 'alliums',
    description: 'Kitchen essential. Sets easier than seed in Scotland.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [4],
      transplantMonths: [4, 5],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 100, max: 175 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 10, rows: 30 },
      depth: 2,
      difficulty: 'beginner',
      tips: [
        'Sets are more reliable than seed in Scotland',
        'Japanese sets can be autumn planted',
        'Cure well in any dry weather'
      ]
    },
    companionPlants: ['Carrots', 'Beetroot', 'Lettuce'],
    avoidPlants: ['Beans', 'Peas']
  },
  {
    id: 'garlic',
    name: 'Garlic',
    category: 'alliums',
    description: 'Plant in autumn for best bulbs. Needs cold period.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [10, 11, 2, 3],
      transplantMonths: [],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 180, max: 270 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 15, rows: 30 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Autumn planting essential for best bulbs',
        'Scottish winters provide needed cold',
        'Hardneck varieties most reliable'
      ]
    },
    companionPlants: ['Roses', 'Tomatoes', 'Beetroot'],
    avoidPlants: ['Beans', 'Peas']
  },
  {
    id: 'leeks',
    name: 'Leeks',
    category: 'alliums',
    description: 'Hardy winter vegetable. Excellent for Scottish gardens!',
    planting: {
      sowIndoorsMonths: [2, 3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [6, 7],
      harvestMonths: [10, 11, 12, 1, 2, 3, 4],
      daysToHarvest: { min: 120, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 15, rows: 30 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Drop seedlings in deep holes for blanched stems',
        'Very hardy - harvest all winter',
        'Musselburgh variety bred for Scottish climate!'
      ]
    },
    companionPlants: ['Carrots', 'Celery', 'Onions'],
    avoidPlants: ['Beans', 'Peas']
  },
  {
    id: 'spring-onions',
    name: 'Spring Onions',
    category: 'alliums',
    description: 'Quick-growing salad onion. Sow successionally.',
    planting: {
      sowIndoorsMonths: [3],
      sowOutdoorsMonths: [4, 5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 80 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 2, rows: 15 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Sow every 3 weeks for continuous harvest',
        'Can be grown in containers',
        'White Lisbon is reliable for Scotland'
      ]
    },
    companionPlants: ['Carrots', 'Lettuce'],
    avoidPlants: ['Beans', 'Peas']
  },

  // ============ HERBS ============
  {
    id: 'basil',
    name: 'Basil',
    category: 'herbs',
    description: 'Frost tender herb. Best on sunny windowsill or greenhouse.',
    planting: {
      sowIndoorsMonths: [4, 5],
      sowOutdoorsMonths: [],
      transplantMonths: [6],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Grow indoors on sunny windowsill',
        'Pinch out flower heads',
        'Protect from any cold'
      ]
    },
    companionPlants: ['Tomatoes', 'Peppers', 'Oregano'],
    avoidPlants: ['Sage', 'Rue']
  },
  {
    id: 'parsley',
    name: 'Parsley',
    category: 'herbs',
    description: 'Versatile hardy herb. Survives Scottish winters.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6, 7],
      transplantMonths: [5, 6],
      harvestMonths: [6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 70, max: 90 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Slow to germinate - be patient',
        'Can survive mild Scottish winters',
        'Cut outer stems first'
      ]
    },
    companionPlants: ['Tomatoes', 'Asparagus', 'Roses'],
    avoidPlants: ['Lettuce']
  },
  {
    id: 'coriander',
    name: 'Coriander (Cilantro)',
    category: 'herbs',
    description: 'Fast-growing herb. Less prone to bolting in Scottish climate!',
    planting: {
      sowIndoorsMonths: [4],
      sowOutdoorsMonths: [5, 6, 7, 8],
      transplantMonths: [],
      harvestMonths: [6, 7, 8, 9, 10],
      daysToHarvest: { min: 40, max: 60 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 15, rows: 20 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Cooler Scottish weather reduces bolting',
        'Sow every 3 weeks for continuous supply',
        'Let some plants set seed for coriander seeds'
      ]
    },
    companionPlants: ['Spinach', 'Tomatoes', 'Peppers'],
    avoidPlants: ['Fennel']
  },
  {
    id: 'mint',
    name: 'Mint',
    category: 'herbs',
    description: 'Vigorous perennial herb. Very hardy - thrives in Scotland!',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6, 7],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'partial-shade',
      water: 'high',
      spacing: { between: 45, rows: 45 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Extremely hardy - loves Scotland',
        'Contain in pots - very invasive',
        'Cut back after flowering'
      ]
    },
    companionPlants: ['Cabbage', 'Tomatoes', 'Peas'],
    avoidPlants: ['Chamomile', 'Parsley']
  },
  {
    id: 'chives',
    name: 'Chives',
    category: 'herbs',
    description: 'Hardy perennial. One of the easiest herbs for Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [4, 5],
      transplantMonths: [5, 6],
      harvestMonths: [4, 5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 20, rows: 30 },
      depth: 1,
      difficulty: 'beginner',
      tips: [
        'Completely hardy - survives any Scottish winter',
        'Divide clumps every few years',
        'Flowers are edible too'
      ]
    },
    companionPlants: ['Carrots', 'Tomatoes', 'Roses'],
    avoidPlants: []
  },
  {
    id: 'rosemary',
    name: 'Rosemary',
    category: 'herbs',
    description: 'Woody perennial herb. Needs sheltered spot in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [],
      transplantMonths: [5, 6, 9],
      harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 60, rows: 60 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Needs sheltered spot from cold winds',
        'Good drainage essential',
        'Can struggle in harsh Scottish winters'
      ]
    },
    companionPlants: ['Beans', 'Cabbage', 'Carrots', 'Sage'],
    avoidPlants: []
  },
  {
    id: 'thyme',
    name: 'Thyme',
    category: 'herbs',
    description: 'Low-growing perennial herb. Hardy in Scotland.',
    planting: {
      sowIndoorsMonths: [3, 4],
      sowOutdoorsMonths: [5, 6],
      transplantMonths: [5, 6, 9],
      harvestMonths: [5, 6, 7, 8, 9, 10],
      daysToHarvest: { min: 90, max: 180 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 30 },
      depth: 0.5,
      difficulty: 'beginner',
      tips: [
        'Needs well-drained soil',
        'Hardy enough for Scottish gardens',
        'Trim after flowering'
      ]
    },
    companionPlants: ['Cabbage', 'Tomatoes', 'Aubergine'],
    avoidPlants: []
  },

  // ============ OTHER SCOTTISH FAVORITES ============
  {
    id: 'rhubarb',
    name: 'Rhubarb',
    category: 'root-vegetables',
    description: 'Perennial vegetable (used as fruit). Thrives in Scottish climate!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [3, 4, 10, 11],
      transplantMonths: [3, 4, 10, 11],
      harvestMonths: [4, 5, 6, 7],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 90, rows: 90 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Perfect for Scottish climate',
        'Dont harvest first year',
        'Force for earlier, sweeter stems'
      ]
    },
    companionPlants: ['Garlic', 'Onions'],
    avoidPlants: []
  },
  {
    id: 'sea-kale',
    name: 'Sea Kale',
    category: 'leafy-greens',
    description: 'Native British perennial. Blanch shoots in spring.',
    planting: {
      sowIndoorsMonths: [2, 3],
      sowOutdoorsMonths: [4],
      transplantMonths: [4, 5],
      harvestMonths: [3, 4, 5],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 60, rows: 60 },
      depth: 2,
      difficulty: 'intermediate',
      tips: [
        'Native to British coastlines',
        'Force under pots for blanched shoots',
        'Very ornamental blue-grey leaves'
      ]
    },
    companionPlants: ['Beans'],
    avoidPlants: []
  },
  {
    id: 'jerusalem-artichoke',
    name: 'Jerusalem Artichoke',
    category: 'root-vegetables',
    description: 'Perennial tuber with nutty flavor. Extremely productive and hardy in Scotland.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [2, 3, 4],
      transplantMonths: [],
      harvestMonths: [10, 11, 12, 1, 2, 3],
      daysToHarvest: { min: 110, max: 150 }
    },
    care: {
      sun: 'full-sun',
      water: 'low',
      spacing: { between: 30, rows: 90 },
      depth: 15,
      difficulty: 'beginner',
      tips: [
        'Plant tubers like potatoes',
        'Can become invasive - harvest thoroughly',
        'Tall plants (up to 3m) make good windbreak',
        'Sweeter after frost'
      ]
    },
    companionPlants: ['Sweetcorn', 'Sunflowers'],
    avoidPlants: ['Potatoes']
  },

  // ============ BERRIES ============
  {
    id: 'strawberry',
    name: 'Strawberry',
    category: 'berries',
    description: 'Beloved summer fruit. Grows well in Scottish climate with protection.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [4, 5, 8, 9],
      transplantMonths: [4, 5, 8, 9],
      harvestMonths: [6, 7, 8, 9],
      daysToHarvest: { min: 60, max: 90 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 35, rows: 75 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Plant with crown at soil level',
        'Replace plants every 3-4 years',
        'Net against birds',
        'Straw mulch keeps fruit clean'
      ]
    },
    companionPlants: ['Lettuce', 'Spinach', 'Beans', 'Borage'],
    avoidPlants: ['Brassicas', 'Fennel']
  },
  {
    id: 'raspberry',
    name: 'Raspberry',
    category: 'berries',
    description: 'Prolific soft fruit. Summer and autumn varieties give extended harvest.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 45, rows: 180 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Autumn varieties fruit on new canes',
        'Summer varieties need support wires',
        'Prune summer types after fruiting',
        'Scottish climate is ideal for raspberries'
      ]
    },
    companionPlants: ['Garlic', 'Tansy', 'Turnips'],
    avoidPlants: ['Blackberries', 'Potatoes']
  },
  {
    id: 'blackberry',
    name: 'Blackberry',
    category: 'berries',
    description: 'Hardy bramble fruit. Thornless varieties easier to manage.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9, 10],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 250, rows: 250 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Thornless varieties much easier',
        'Train along wires or fence',
        'Cut out fruited canes after harvest',
        'Very vigorous - needs space'
      ]
    },
    companionPlants: ['Tansy', 'Hyssop'],
    avoidPlants: ['Raspberries']
  },
  {
    id: 'blueberry',
    name: 'Blueberry',
    category: 'berries',
    description: 'Acid-loving shrub with delicious berries. Needs ericaceous soil.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [10, 11, 3, 4],
      transplantMonths: [10, 11, 3, 4],
      harvestMonths: [7, 8, 9],
      daysToHarvest: { min: 730, max: 1095 }
    },
    care: {
      sun: 'full-sun',
      water: 'high',
      spacing: { between: 150, rows: 200 },
      depth: 5,
      difficulty: 'intermediate',
      tips: [
        'Must have acidic soil (pH 4.5-5.5)',
        'Use ericaceous compost in containers',
        'Water with rainwater not tap water',
        'Net against birds'
      ]
    },
    companionPlants: ['Rhododendrons', 'Azaleas', 'Heathers'],
    avoidPlants: []
  },
  {
    id: 'gooseberry',
    name: 'Gooseberry',
    category: 'berries',
    description: 'Traditional Scottish soft fruit. Hardy and productive.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [6, 7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 150, rows: 150 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Tolerates shade better than other fruits',
        'Prune to open goblet shape',
        'Pick early for cooking, ripe for dessert',
        'Watch for sawfly caterpillars'
      ]
    },
    companionPlants: ['Tomatoes', 'Tansy'],
    avoidPlants: []
  },
  {
    id: 'blackcurrant',
    name: 'Blackcurrant',
    category: 'berries',
    description: 'Very hardy soft fruit packed with vitamin C. Thrives in Scotland!',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 150, rows: 180 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Plant 5cm deeper than nursery level',
        'Cut all stems to ground after planting',
        'Remove a third of old wood each year',
        'High in vitamin C - perfect for Scottish winters'
      ]
    },
    companionPlants: ['Wormwood', 'Tansy'],
    avoidPlants: ['Pine trees']
  },
  {
    id: 'redcurrant',
    name: 'Redcurrant',
    category: 'berries',
    description: 'Ornamental and productive soft fruit. Easy to grow in Scotland.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 365, max: 730 }
    },
    care: {
      sun: 'partial-shade',
      water: 'moderate',
      spacing: { between: 150, rows: 150 },
      depth: 5,
      difficulty: 'beginner',
      tips: [
        'Can be trained as cordons against walls',
        'Tolerates shade well',
        'Prune like gooseberries',
        'Beautiful when fruiting'
      ]
    },
    companionPlants: ['Tansy', 'Wormwood'],
    avoidPlants: []
  },

  // ============ FRUIT TREES ============
  {
    id: 'apple-tree',
    name: 'Apple Tree',
    category: 'fruit-trees',
    description: 'Classic fruit tree. Choose dwarf rootstocks for smaller spaces.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9, 10, 11],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 300, rows: 400 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'M26 or M27 rootstock for small gardens',
        'Most need a pollination partner',
        'Prune in winter when dormant',
        'Scottish varieties like Discovery do well'
      ]
    },
    companionPlants: ['Chives', 'Nasturtiums', 'Garlic'],
    avoidPlants: ['Grass around base', 'Potatoes']
  },
  {
    id: 'cherry-tree',
    name: 'Cherry Tree',
    category: 'fruit-trees',
    description: 'Beautiful blossom and delicious fruit. Sweet and sour varieties available.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [7, 8],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 400, rows: 500 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Choose self-fertile varieties like Stella',
        'Gisela rootstocks keep trees smaller',
        'Net against birds - they love cherries!',
        'Prune only in summer to avoid disease'
      ]
    },
    companionPlants: ['Garlic', 'Chives', 'Marigolds'],
    avoidPlants: ['Grass around base']
  },
  {
    id: 'damson-tree',
    name: 'Damson Tree',
    category: 'fruit-trees',
    description: 'Hardy plum relative. Self-fertile and excellent for Scottish gardens.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [9, 10],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 350, rows: 400 },
      depth: 0,
      difficulty: 'beginner',
      tips: [
        'Self-fertile - no pollination partner needed',
        'Very hardy - ideal for Scottish climate',
        'Perfect for jam and gin',
        'Minimal pruning required'
      ]
    },
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base']
  },
  {
    id: 'plum-tree',
    name: 'Plum Tree',
    category: 'fruit-trees',
    description: 'Delicious stone fruit. Victoria is self-fertile and reliable.',
    planting: {
      sowIndoorsMonths: [],
      sowOutdoorsMonths: [11, 12, 1, 2, 3],
      transplantMonths: [11, 12, 1, 2, 3],
      harvestMonths: [8, 9],
      daysToHarvest: { min: 730, max: 1825 }
    },
    care: {
      sun: 'full-sun',
      water: 'moderate',
      spacing: { between: 350, rows: 400 },
      depth: 0,
      difficulty: 'intermediate',
      tips: [
        'Victoria is self-fertile and popular',
        'Prune in summer to avoid silver leaf',
        'May need thinning if heavy crop',
        'Late frost can damage blossom in Scotland'
      ]
    },
    companionPlants: ['Garlic', 'Chives', 'Comfrey'],
    avoidPlants: ['Grass around base']
  }
]

// Helper functions for working with vegetable data
export function getVegetableById(id: string): Vegetable | undefined {
  return vegetables.find(v => v.id === id)
}

export function getVegetablesByCategory(category: VegetableCategory): Vegetable[] {
  return vegetables.filter(v => v.category === category)
}

export function searchVegetables(query: string): Vegetable[] {
  const lowerQuery = query.toLowerCase()
  return vegetables.filter(v => 
    v.name.toLowerCase().includes(lowerQuery) ||
    v.description.toLowerCase().includes(lowerQuery)
  )
}

export function getVegetablesForMonth(month: number, type: 'sow' | 'harvest'): Vegetable[] {
  return vegetables.filter(v => {
    if (type === 'sow') {
      return v.planting.sowOutdoorsMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) ||
             v.planting.sowIndoorsMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
    }
    return v.planting.harvestMonths.includes(month as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)
  })
}

export function getAllCategories(): VegetableCategory[] {
  return [...new Set(vegetables.map(v => v.category))]
}
