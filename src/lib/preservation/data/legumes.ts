/**
 * Legumes — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  GARDEN_ORGANIC_STORING,
  UMN_HARVEST_STORAGE,
  BBC_GOOD_FOOD,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
  bbcGoodFoodRecipe,
} from '../resources'

export const legumesPreservation: PreservationGuide[] = [
  {
    plantId: 'peas',
    summary:
      'The sugars turn to starch within hours of picking — eat them the same day or get them straight into the freezer.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick, pod and eat the same day if you can — peas lose their sweetness faster than anything else on the plot. Unpodded they hold 3–4 days in the fridge.',
        storageLife: '3–4 days in the pod, fridge',
      },
      {
        method: 'freeze',
        how: 'Pod, blanch for 90 seconds, cool in cold water, then open-freeze on a tray before bagging. Done within an hour of picking they beat anything from the shop.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('pea', 'Pea'),
      bbcGoodFoodCollection('pea-recipes', 'Pea recipes'),
      bbcGoodFoodRecipe('pea-ham-soup', 'Pea & ham soup'),
    ],
  },
  {
    plantId: 'runner-beans',
    summary:
      'The great Scottish glut crop — freeze the young ones and turn the stragglers into chutney.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in a loose bag in the salad drawer. Pick young and often — pods left to swell go stringy and slow the plant down.',
        storageLife: '3–5 days',
      },
      {
        method: 'freeze',
        how: 'Top, tail and de-string, slice diagonally, blanch for 2 minutes, cool and bag in meal-sized portions.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'Runner bean chutney is the classic answer to the ones that got away — slice, salt, then simmer with vinegar, sugar, mustard and turmeric.',
        storageLife: '1 year+ in sealed jars',
        resources: [BBC_GOOD_FOOD.chutneys],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('runner_bean', 'Runner bean'),
      bbcGoodFoodCollection('runner-bean-recipes', 'Runner bean recipes'),
    ],
  },
  {
    plantId: 'broad-beans',
    summary:
      'Pod and freeze the main crop; let the last pods dry on the plant for winter stews.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick while the beans are the size of a thumbnail and eat within a couple of days — big floury beans want skinning after cooking.',
        storageLife: '2–3 days in the pod, fridge',
      },
      {
        method: 'freeze',
        how: 'Pod, blanch for 2 minutes, cool and bag. The grey skins slip off easily once defrosted if you want bright green beans.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Leave the last pods to blacken and dry on the plant, then shell and store the beans in airtight jars. Soak overnight and boil until tender before eating.',
        storageLife: '1 year+ in airtight jars',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('broad_beans', 'Broad bean'),
      bbcGoodFoodCollection('broad-bean-recipes', 'Broad bean recipes'),
    ],
  },
  {
    plantId: 'french-beans',
    summary: 'Quick to glut in a good week — blanch and freeze whatever you cannot eat fresh.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick pencil-thin and eat within a few days, keeping any extras unwashed in a bag in the fridge. Keep picking to keep the plants cropping.',
        storageLife: '3–5 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Top and tail, blanch whole for 2 minutes, cool in cold water and freeze flat on a tray before bagging.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('french_beans', 'French bean')],
  },
  {
    plantId: 'climbing-french-beans',
    summary:
      'Freeze the glut of green pods, and let a few plants run on for home-grown haricot beans.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young and slim every couple of days and keep unwashed in the fridge.',
        storageLife: '3–5 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Top and tail, blanch for 2 minutes, cool and bag in portions — climbers crop hard so the freezer earns its keep.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Leave late pods to dry on the vine until they rattle, then shell out the haricots into airtight jars. Dried beans must be soaked and boiled hard for at least 10 minutes before eating — never slow-cook them from raw.',
        storageLife: '1 year+ in airtight jars',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('french_beans', 'French bean')],
  },
  {
    plantId: 'borlotti-beans',
    summary:
      'Grown for drying — let the speckled pods rattle on the vine, then shell into jars for winter.',
    methods: [
      {
        method: 'fresh',
        how: 'Shell the beans at the plump, mottled stage and simmer until tender for the best fresh borlotti — always cook them well, never eat raw.',
        storageLife: 'use within a few days of shelling',
      },
      {
        method: 'dry',
        how: 'Leave the pods on the plant until papery and rattling; in a wet autumn pull whole plants and hang them somewhere airy to finish. Shell once fully dry.',
        resources: [NCHFP.drying, GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store the shelled dried beans in airtight jars somewhere cool and dark. Soak overnight and boil hard for at least 10 minutes before eating — never slow-cook dried borlotti from raw.',
        storageLife: '1 year+ in airtight jars',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('borlotti_bean', 'Borlotti bean')],
  },
  {
    plantId: 'edamame',
    summary: 'Best steamed the day they are picked — blanch and freeze the pods for later.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick while the pods are plump and bright green and steam or boil them the same day — the flavour fades fast.',
        storageLife: '1–2 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Blanch whole pods for 2–3 minutes, cool in cold water and freeze in bags. Cook straight from frozen with a pinch of salt.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('soya_bean', 'Soya bean')],
  },
  {
    plantId: 'mangetout',
    summary: 'Pick flat and young, eat fresh — the freezer is a fallback for a heavy week.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick while the pods are flat, before the peas swell, and keep in a bag in the fridge. Crispest eaten within a day or two.',
        storageLife: '2–3 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Blanch for 1 minute, cool fast and open-freeze on a tray. They soften a little, so save frozen ones for stir-fries rather than salads.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('mangetout', 'Mangetout')],
  },
  {
    plantId: 'sugar-snap-peas',
    summary: 'Sweetest straight off the plant — blanch and freeze only what you cannot keep up with.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick when the pods are plump but still snap cleanly, and eat within a couple of days from the fridge.',
        storageLife: '2–3 days in the fridge',
      },
      {
        method: 'freeze',
        how: 'Top, tail and de-string, blanch for 90 seconds, cool and freeze on a tray before bagging. Best used in cooked dishes after freezing.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('pea', 'Pea'),
      bbcGoodFoodCollection('pea-recipes', 'Pea recipes'),
    ],
  },
  {
    plantId: 'asparagus-peas',
    summary:
      'A pick-daily novelty — the winged pods are only good tiny, so eat fresh and freeze small batches.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick the pods at 2–3cm — any bigger and they turn woody. Best steamed with butter the day they are picked.',
        storageLife: '1–2 days in the fridge',
      },
      {
        method: 'fridge',
        how: 'Keep unwashed in a bag in the salad drawer and use quickly; they toughen in storage as well as on the plant.',
        storageLife: '2–3 days',
      },
      {
        method: 'freeze',
        how: 'Blanch for 1 minute, cool and open-freeze. A fallback for a glut rather than a highlight — save frozen ones for stews.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
  },
  {
    plantId: 'black-turtle-beans',
    summary:
      'A true storage crop — dry on the vine, jar up for the year, and always boil hard before eating.',
    methods: [
      {
        method: 'dry',
        how: 'Leave the pods to dry fully on the plant until they rattle; if autumn turns wet, pull whole plants and hang them under cover to finish. Shell once papery.',
        resources: [NCHFP.drying, GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store the dried beans in airtight jars somewhere cool and dark. Soak overnight and boil hard for at least 10 minutes before eating — never slow-cook dried beans from raw.',
        storageLife: '1 year+ in airtight jars',
      },
      {
        method: 'freeze',
        how: 'Cook a big pot properly (soaked, then boiled hard) and freeze in tubs with a little of the cooking liquid — home-made tinned beans.',
        storageLife: '6 months frozen, cooked',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('black_beans', 'Black bean')],
  },
  {
    plantId: 'fenugreek',
    summary:
      'Two crops in one — fresh methi leaves for the fridge, and seed pods dried for the spice jar.',
    methods: [
      {
        method: 'fridge',
        how: 'Use the methi leaves fresh in curries and flatbreads; a bunch keeps a few days wrapped in damp paper in the fridge.',
        storageLife: '3–4 days',
      },
      {
        method: 'dry',
        how: 'Dry bunches of leaves somewhere warm and airy for kasuri methi, and let seed pods dry fully on the plant before shelling the seeds into a jar for spice.',
        storageLife: 'leaves 6–12 months; seeds 1 year+ in airtight jars',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('fenugreek', 'Fenugreek')],
  },
  {
    plantId: 'ground-nut',
    summary:
      'Treat the tubers like small potatoes — lift in autumn, store cool and dark, and always cook before eating.',
    methods: [
      {
        method: 'store-cool',
        how: 'Lift the tubers in autumn once the tops die back and store somewhere cool, dark and frost-free in a paper sack or a box of dry compost. Always cook them thoroughly — never eat raw.',
        storageLife: '2–4 months, cool and dark',
        resources: [GARDEN_ORGANIC_STORING, UMN_HARVEST_STORAGE],
      },
      {
        method: 'fridge',
        how: 'Smaller amounts keep in a paper bag in the fridge — do not wash until you are ready to cook them.',
        storageLife: '2–3 weeks',
      },
    ],
  },
]
