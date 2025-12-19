// src/data/scotland-calendar.ts
// Scotland-specific monthly gardening tasks and recommendations

export interface MonthlyTasks {
  month: string
  emoji: string
  overview: string
  sowIndoors: string[]
  sowOutdoors: string[]
  plantOut: string[]
  harvest: string[]
  tasks: string[]
  composting: string
  rotation: string
  companions: string
  organic: string
  weather: string
  tip: string
}

export const scotlandMonthlyCalendar: Record<string, MonthlyTasks> = {
  january: {
    month: 'January',
    emoji: '❄️',
    overview: 'The quietest month on the plot. A good time for planning, ordering seeds, and dreaming of the season ahead.',
    sowIndoors: [
      'Onions (mid-month onwards)',
      'Chillies and peppers (need long season)',
      'Early tomatoes (late January)'
    ],
    sowOutdoors: [],
    plantOut: [
      'Garlic cloves (if ground workable)',
      'Bare-root fruit trees and bushes'
    ],
    harvest: [
      'Leeks',
      'Parsnips (sweeter after frost)',
      'Brussels sprouts',
      'Kale',
      'Winter cabbage',
      'Stored roots'
    ],
    tasks: [
      'Order seeds early for best selection',
      'Plan this year\'s crop rotation on paper',
      'Clean and sharpen tools',
      'Check stored veg and remove any rotting',
      'Prune apple and pear trees on dry days',
      'Force rhubarb with an upturned bucket',
      'Dig over empty beds when ground allows'
    ],
    composting: 'Turn your heap if not frozen. Add shredded Christmas tree branches for carbon. Kitchen scraps keep the heap ticking over.',
    rotation: 'Perfect time to sketch your rotation plan. Where did brassicas grow last year? That bed should get legumes or roots this season.',
    companions: 'While planning, group friendly plants together: tomatoes with basil, carrots near alliums, brassicas away from strawberries.',
    organic: 'Order organic seeds now. Check your comfrey patch – established plants can be divided in dormancy.',
    weather: 'Expect hard frosts and possible snow. Ground often frozen or waterlogged. Shortest days, but light is returning.',
    tip: 'A quiet month is a gift. Use it to flip through seed catalogues and make notes about what worked last year.'
  },

  february: {
    month: 'February',
    emoji: '🌱',
    overview: 'Spring stirs beneath the soil. Days lengthen noticeably and early sowings can begin indoors.',
    sowIndoors: [
      'Tomatoes',
      'Peppers and aubergines',
      'Broad beans (for planting out next month)',
      'Lettuce and salad leaves',
      'Onions and leeks',
      'Early brassicas'
    ],
    sowOutdoors: [
      'Parsnips (late month, soil permitting)',
      'Broad beans under cloches'
    ],
    plantOut: [
      'Shallot sets',
      'Onion sets',
      'Garlic (last chance)',
      'Jerusalem artichokes'
    ],
    harvest: [
      'Leeks',
      'Parsnips',
      'Purple sprouting broccoli',
      'Kale',
      'Chard',
      'Forced rhubarb'
    ],
    tasks: [
      'Chit seed potatoes in egg boxes, cool and light',
      'Cover soil with black plastic to warm it up',
      'Prepare seed beds with compost',
      'Check netting over brassicas – hungry pigeons about',
      'Prune autumn-fruiting raspberries to ground level',
      'Last chance for bare-root planting',
      'Clean the greenhouse glass for maximum light'
    ],
    composting: 'Heap should be waking up. Turn if you can, or just add fresh greens from early weeding to restart microbial activity.',
    rotation: 'Prepare your legume bed with compost – peas and beans fix nitrogen but still appreciate a good start.',
    companions: 'Plan to sow carrots near spring onions later. The allium scent confuses carrot fly.',
    organic: 'Make nettle or comfrey tea from last year\'s dried leaves. Dilute 10:1 for early seedlings.',
    weather: 'Still cold with regular frosts. Ground slowly warming. Watch for "false springs" – don\'t be fooled into planting tender crops.',
    tip: 'Warm soil grows better crops than cold soil with seeds in it. Patience pays off.'
  },

  march: {
    month: 'March',
    emoji: '🌿',
    overview: 'The season begins in earnest. Sowing picks up pace and the first potatoes go in.',
    sowIndoors: [
      'Brassicas (cabbage, cauliflower, broccoli)',
      'Courgettes and squash',
      'Sweetcorn',
      'Celeriac and celery',
      'Cucumbers',
      'More lettuce for succession'
    ],
    sowOutdoors: [
      'Broad beans',
      'Early peas',
      'Parsnips',
      'Spinach',
      'Radishes',
      'Spring onions',
      'Beetroot (late month, under fleece)'
    ],
    plantOut: [
      'First early potatoes (mid-month)',
      'Onion sets',
      'Shallots',
      'Asparagus crowns',
      'Rhubarb crowns'
    ],
    harvest: [
      'Purple sprouting broccoli (peak)',
      'Leeks',
      'Kale',
      'Spring greens',
      'Stored roots (use them up!)',
      'Forced rhubarb'
    ],
    tasks: [
      'Plant first early potatoes in prepared trenches',
      'Top dress beds with compost before sowing',
      'Start hardening off early indoor sowings',
      'Put up supports for peas',
      'Weed beds before crops get going',
      'Check fruit bushes for big bud mite',
      'Mulch fruit trees and bushes'
    ],
    composting: 'Heap is active now. Early weeds and grass clippings provide fresh greens. Balance with cardboard or shredded paper.',
    rotation: 'Potatoes go in the bed that had legumes last year – they benefit from the nitrogen left behind.',
    companions: 'Sow marigold seeds alongside tomatoes for later planting together. Both like the same conditions.',
    organic: 'Encourage ground beetles and frogs – they eat slugs. Create habitat piles from prunings.',
    weather: 'Changeable. Frost still likely, especially at night. Ground warming but can be wet. Good drying days becoming more frequent.',
    tip: 'Don\'t rush tender crops. Another month won\'t hurt them, but a late frost will.'
  },

  april: {
    month: 'April',
    emoji: '🌸',
    overview: 'Busy days on the plot. Direct sowing takes off and indoor seedlings need attention.',
    sowIndoors: [
      'Runner beans',
      'French beans',
      'Courgettes (second batch)',
      'Pumpkins and winter squash',
      'Sweetcorn (if not done)',
      'Cucumbers'
    ],
    sowOutdoors: [
      'Carrots',
      'Beetroot',
      'Parsnips (last chance)',
      'Swiss chard',
      'Peas (succession)',
      'Radishes',
      'Turnips',
      'Lettuce',
      'Rocket',
      'Spinach'
    ],
    plantOut: [
      'Second early potatoes',
      'Broad beans (from indoor sowing)',
      'Onion sets',
      'Cauliflower and cabbage (under fleece)',
      'Strawberry runners'
    ],
    harvest: [
      'Purple sprouting broccoli (last of it)',
      'Spring cabbage',
      'Leeks (bolt soon)',
      'Rhubarb (outdoor now)',
      'Asparagus (established beds)',
      'First radishes'
    ],
    tasks: [
      'Earth up potato shoots as they appear',
      'Protect brassicas with netting against butterflies',
      'Thin seedlings – be ruthless',
      'Harden off indoor-grown plants gradually',
      'Pinch out tops of broad beans if blackfly appear',
      'Stake peas and early beans',
      'Prepare ground for tender crops next month'
    ],
    composting: 'Lots of material now – thin seedlings, weeds, grass. Build your heap up. Keep it moist but not waterlogged.',
    rotation: 'Plant brassicas where you grew legumes last year. Avoid where brassicas were – clubroot persists in soil.',
    companions: 'Interplant lettuce between slow crops like brassicas. The lettuce is harvested before the big plants need the space.',
    organic: 'Encourage ladybirds and hoverflies with flowering herbs. They devour aphids.',
    weather: 'Warming but frost still possible until mid-May. April showers help, but cold snaps catch people out every year.',
    tip: 'Better to wait a week than lose plants to a late frost. Scottish springs take their time.'
  },

  may: {
    month: 'May',
    emoji: '☀️',
    overview: 'The risk of frost eases. Tender crops finally go out and the plot transforms.',
    sowIndoors: [
      'Late courgettes',
      'Succession lettuce',
      'Quick-maturing beans'
    ],
    sowOutdoors: [
      'Runner beans (direct after mid-month)',
      'French beans',
      'Sweetcorn (direct)',
      'More carrots',
      'Beetroot (succession)',
      'Swedes',
      'Florence fennel',
      'Chicory',
      'Kale for winter'
    ],
    plantOut: [
      'Tomatoes (after last frost)',
      'Courgettes and squash',
      'Pumpkins',
      'Cucumbers',
      'Peppers and chillies',
      'Sweetcorn',
      'Runner beans',
      'Brassicas (cabbage, broccoli, cauliflower)',
      'Celeriac and celery',
      'Leeks (trenches)'
    ],
    harvest: [
      'Asparagus (stop by June)',
      'Rhubarb (ease off mid-month)',
      'Radishes',
      'Spring onions',
      'Lettuce',
      'Spinach',
      'Broad beans (early)',
      'Early peas'
    ],
    tasks: [
      'Plant out tender crops after last frost (around mid-May)',
      'Harden off everything over 7-10 days first',
      'Keep earthing up potatoes',
      'Water transplants until established',
      'Mulch around thirsty plants',
      'Net brassicas against pigeons and butterflies',
      'Tie in climbing beans and cucumbers'
    ],
    composting: 'Grass clippings aplenty – mix with cardboard to avoid slime. A well-fed heap breaks down fast in warmer weather.',
    rotation: 'Cucurbits (squash, courgettes) do well where you had heavy compost additions. They\'re hungry plants.',
    companions: 'Plant basil near tomatoes now. Add nasturtiums near brassicas to lure caterpillars away.',
    organic: 'Water with diluted comfrey or nettle tea every fortnight. Home-grown plant food.',
    weather: 'Last frost typically mid-May in central Scotland, later in highlands. Warming nicely. Long days help everything grow.',
    tip: 'Watch the local forecast, not the calendar. One cold night can undo weeks of work.'
  },

  june: {
    month: 'June',
    emoji: '🌻',
    overview: 'Long days and (hopefully) warm weather. Everything is growing. Water and weeding become priorities.',
    sowIndoors: [],
    sowOutdoors: [
      'Carrots (successional)',
      'Beetroot (successional)',
      'Swedes and turnips',
      'French beans (late)',
      'Spring cabbage for autumn',
      'Kale and purple sprouting for winter',
      'Florence fennel'
    ],
    plantOut: [
      'Leeks (continue transplanting)',
      'Brassicas for winter',
      'Late courgettes',
      'Any remaining tender crops'
    ],
    harvest: [
      'Broad beans',
      'Peas',
      'New potatoes (first earlies!)',
      'Lettuce',
      'Radishes',
      'Spinach',
      'Strawberries',
      'Gooseberries',
      'Early courgettes',
      'Calabrese'
    ],
    tasks: [
      'Water consistently – little and often is better than floods',
      'Mulch to retain moisture and suppress weeds',
      'Remove sideshoots from cordon tomatoes',
      'Feed tomatoes, peppers and cucumbers weekly',
      'Harvest little and often to encourage more',
      'Pinch out broad bean tops after flowering',
      'Watch for pests – check under leaves'
    ],
    composting: 'Turn the heap. Hot weather speeds decomposition. Keep it moist. Harvest finished compost from the bottom for mulching.',
    rotation: 'After harvesting early potatoes or broad beans, sow a green manure or plant winter brassicas in the space.',
    companions: 'Let some herbs flower – dill, fennel, coriander attract beneficial insects that eat pests.',
    organic: 'Hand-pick caterpillars from brassicas each evening. Check under leaves. Consistent effort beats sprays.',
    weather: 'Longest days. Can be warm and dry, or cool and damp – Scottish summers vary! Watering often needed.',
    tip: 'The "hungry gap" is over. Enjoy the abundance but remember to keep sowing for autumn and winter.'
  },

  july: {
    month: 'July',
    emoji: '🍅',
    overview: 'Peak growing season. Harvests come thick and fast. Keep picking, watering, and enjoying.',
    sowIndoors: [],
    sowOutdoors: [
      'Spring cabbage',
      'Chard (for winter)',
      'Carrots (short varieties for autumn)',
      'Beetroot (last sowing)',
      'Turnips',
      'Pak choi and oriental greens',
      'Lettuce (heat-tolerant varieties)'
    ],
    plantOut: [
      'Winter brassicas (sprouting broccoli, kale, Brussels sprouts)',
      'Leeks (final transplanting)',
      'Autumn cauliflower'
    ],
    harvest: [
      'Tomatoes (start ripening)',
      'Courgettes (daily!)',
      'Beans (runner and French)',
      'Peas',
      'Potatoes (second earlies)',
      'Onions and shallots (when tops fall)',
      'Garlic',
      'Beetroot',
      'Carrots',
      'Cucumbers',
      'Strawberries (late)',
      'Raspberries',
      'Currants (red, black, white)',
      'Blueberries'
    ],
    tasks: [
      'Pick courgettes while small – they grow fast',
      'Continue feeding tomatoes, peppers, cucumbers',
      'Remove yellowing leaves from tomato plants',
      'Harvest beans before they go stringy',
      'Lift onions and garlic when leaves yellow',
      'Dry onions and garlic in sun before storing',
      'Net soft fruit against birds',
      'Summer prune trained fruit trees'
    ],
    composting: 'Add soft fruit waste (no diseased material). Layer with browns from cardboard. Heap works hard in the heat.',
    rotation: 'As you clear early crops, note what grew where. Fill gaps with green manures or fast salads.',
    companions: 'Interplant quick salads between slower-maturing crops. Uses space efficiently.',
    organic: 'Collect rainwater when you can – tap water is fine but rainwater is better for plants.',
    weather: 'Can be hot and dry, or disappointingly cool. Water in evenings to reduce evaporation. Watch for blight in humid weather.',
    tip: 'If you\'re going on holiday, ask a plot neighbour to harvest your courgettes. They\'ll thank you for them.'
  },

  august: {
    month: 'August',
    emoji: '🌽',
    overview: 'The glut arrives. Preserve what you can\'t eat fresh. Start thinking about autumn and winter.',
    sowIndoors: [],
    sowOutdoors: [
      'Spinach for autumn',
      'Winter lettuce (cold-tolerant varieties)',
      'Pak choi and mizuna',
      'Rocket',
      'Spring onions for overwintering',
      'Green manures on empty beds'
    ],
    plantOut: [
      'Strawberry runners for next year',
      'Spring cabbage',
      'Final winter brassicas'
    ],
    harvest: [
      'Tomatoes (peak)',
      'Sweetcorn',
      'Courgettes and summer squash',
      'Beans (runner and French)',
      'Peppers and chillies',
      'Cucumbers',
      'Maincrop potatoes (late month)',
      'Onions',
      'Carrots',
      'Beetroot',
      'Apples (early varieties)',
      'Plums and damsons',
      'Autumn raspberries begin'
    ],
    tasks: [
      'Freeze, pickle, or preserve excess veg',
      'Make chutneys and jams',
      'Lift and dry maincrop onions',
      'Start lifting maincrop potatoes late month',
      'Cut back fruited raspberry canes',
      'Stop feeding tomatoes late month for ripening',
      'Order garlic and onion sets for autumn planting',
      'Sow green manures on empty beds'
    ],
    composting: 'Big inputs now – failed crops, spent plants, fruit waste. Balance with browns. A well-made heap now will be ready by spring.',
    rotation: 'Excellent time to add compost to empty beds. Mark what went where – you\'ll forget by next year.',
    companions: 'Marigolds and nasturtiums still protecting crops. Leave them until frost takes them.',
    organic: 'Save seeds from your best plants. Tomatoes, beans, and peas are easy to start with.',
    weather: 'Can be warm or wet. Watch for blight on potatoes and tomatoes in humid spells. Days shortening noticeably.',
    tip: 'You can never have too much frozen soup. Roast and freeze a tray of mixed veg for instant winter meals.'
  },

  september: {
    month: 'September',
    emoji: '🍂',
    overview: 'Autumn arrives. Harvests continue and the plot winds down gradually. Excellent planting month for many crops.',
    sowIndoors: [],
    sowOutdoors: [
      'Overwintering onion sets',
      'Garlic (from mid-month)',
      'Spring cabbage',
      'Spinach for overwintering',
      'Winter lettuce varieties',
      'Green manures (phacelia, field beans)'
    ],
    plantOut: [
      'Overwintering onion sets',
      'Garlic',
      'Strawberry plants'
    ],
    harvest: [
      'Maincrop potatoes',
      'Sweetcorn (finish)',
      'Squash and pumpkins (cure in sun)',
      'Tomatoes (green ones too)',
      'Peppers and chillies',
      'Beans (final pickings)',
      'Apples and pears',
      'Autumn raspberries',
      'Carrots',
      'Beetroot',
      'Leeks (start)',
      'Cabbages'
    ],
    tasks: [
      'Lift maincrop potatoes on a dry day',
      'Cure squash in sunshine for 2 weeks before storing',
      'Make green tomato chutney',
      'Clear finished crops promptly',
      'Plant garlic cloves pointy end up',
      'Net brassicas against pigeons',
      'Collect and compost fallen leaves',
      'Cover soil with compost or green manure'
    ],
    composting: 'Fallen leaves are gold – bag some to make leaf mould separately. Add spent plants to the main heap.',
    rotation: 'Plant garlic where brassicas grew. Alliums don\'t follow alliums. Note everything down.',
    companions: 'Clear summer companions now. Their job is done. Add them to compost.',
    organic: 'Leave seedheads for birds. They repay you by eating pests. Tidy-ish is fine.',
    weather: 'Cooling noticeably. First frosts possible late month, especially inland. Misty mornings. Still some good growing weather.',
    tip: 'Green tomatoes ripen indoors on a sunny windowsill. Or add a banana to the box to speed things up.'
  },

  october: {
    month: 'October',
    emoji: '🎃',
    overview: 'Clear, plant, and prepare. The shift to winter gardening. Good time for soil improvement.',
    sowIndoors: [],
    sowOutdoors: [
      'Garlic (good month for it)',
      'Broad beans (overwintering varieties)',
      'Peas (hardy varieties, for early crop)',
      'Green manures'
    ],
    plantOut: [
      'Garlic',
      'Overwintering onion sets',
      'Rhubarb crowns',
      'Bare-root fruit trees and bushes (from late month)'
    ],
    harvest: [
      'Squash and pumpkins',
      'Apples and pears (store carefully)',
      'Carrots and parsnips',
      'Beetroot',
      'Celeriac',
      'Leeks',
      'Cabbages',
      'Brussels sprouts (after first frost)',
      'Kale',
      'Chard'
    ],
    tasks: [
      'Clear all finished crops',
      'Add compost to empty beds',
      'Plant garlic on the shortest day (tradition says)',
      'Protect late crops with fleece',
      'Lift and store carrots and beetroot, or mulch heavily',
      'Cut back perennial herbs',
      'Check stored fruit and veg for rot',
      'Clean and store canes and supports'
    ],
    composting: 'Heap slows as temperatures drop. Turn one last time. Cover to retain heat and shed rain.',
    rotation: 'Plan next year while this year is fresh in mind. Photograph your beds. It helps.',
    companions: 'Winter crops need less companion help. But garlic planted near roses helps both.',
    organic: 'Spread compost now and let winter weather work it into the soil. No digging needed.',
    weather: 'Frost increasingly likely. Shorter days. Rain can make the plot soggy. Pick harvest mornings carefully.',
    tip: 'Parsnips sweeten after frost. No rush to lift them – they store perfectly in the ground.'
  },

  november: {
    month: 'November',
    emoji: '🍁',
    overview: 'The plot winds down. Focus shifts to protection, storage, and preparation for the year ahead.',
    sowIndoors: [],
    sowOutdoors: [
      'Broad beans (hardy varieties, early month)',
      'Garlic (last chance)'
    ],
    plantOut: [
      'Bare-root fruit trees and bushes',
      'Hedging plants',
      'Rhubarb and asparagus crowns'
    ],
    harvest: [
      'Leeks',
      'Brussels sprouts',
      'Parsnips',
      'Celeriac',
      'Winter cabbage',
      'Kale',
      'Chard',
      'Jerusalem artichokes (after frost)',
      'Late apples and pears'
    ],
    tasks: [
      'Finish clearing summer crops',
      'Cover bare soil with mulch or green manure',
      'Protect tender herbs (bay, rosemary) from hard frost',
      'Lag outdoor taps',
      'Clean and oil tools before storing',
      'Build new beds and paths while ground is workable',
      'Collect fallen leaves for leaf mould',
      'Plan improvements for next year'
    ],
    composting: 'Heap dormant now. Insulate with cardboard or old carpet if very cold. Finished compost can be spread on beds.',
    rotation: 'Beds resting over winter. Consider which beds need extra organic matter for hungry crops like squash next year.',
    companions: 'Most companions have done their work. Perennial herbs soldier on – protect rosemary from harsh frost.',
    organic: 'Leave stems and seedheads standing – shelter for beneficial insects overwintering.',
    weather: 'Cold, often wet. First hard frosts. Daylight short. Good for outdoor work on dry days, but fewer of them.',
    tip: 'A tidy plot is nice, but wildlife needs shelter too. Leave some wildness in the corners.'
  },

  december: {
    month: 'December',
    emoji: '⛄',
    overview: 'The garden rests, and so can you. A time for planning, dreaming, and the odd harvest.',
    sowIndoors: [],
    sowOutdoors: [],
    plantOut: [
      'Bare-root trees and bushes (when ground allows)'
    ],
    harvest: [
      'Brussels sprouts (Christmas dinner!)',
      'Parsnips',
      'Leeks',
      'Winter cabbage',
      'Kale',
      'Celeriac',
      'Jerusalem artichokes',
      'Stored roots, squash, and onions'
    ],
    tasks: [
      'Rest and reflect on the year',
      'Review what grew well and what didn\'t',
      'Browse seed catalogues – planning is half the fun',
      'Check stored vegetables',
      'Protect brassicas from pigeons',
      'Order seeds before popular varieties sell out',
      'Make notes for next year while memories are fresh',
      'Service your mower over winter'
    ],
    composting: 'Minimal activity. Keep adding kitchen scraps under a layer of browns. It all breaks down eventually.',
    rotation: 'Finalise next year\'s rotation plan. Keep it simple – four beds, four groups, rotate annually.',
    companions: 'Read up on companion planting over winter. Make notes of combinations to try.',
    organic: 'Winter is for reading. Seed catalogues, gardening books, the wisdom of old allotmenteers.',
    weather: 'Shortest days. Hard frost likely. Snow possible. Ground often frozen or waterlogged. Not much to do outside.',
    tip: 'The best thing you can grow in December is your plans for next year. Curl up with a seed catalogue.'
  }
}

export const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
] as const

export type MonthKey = typeof MONTH_KEYS[number]

// Helper to get current month key
export function getCurrentMonthKey(): MonthKey {
  return MONTH_KEYS[new Date().getMonth()]
}

// Helper to get month display name
export function getMonthDisplayName(key: MonthKey): string {
  return scotlandMonthlyCalendar[key].month
}

