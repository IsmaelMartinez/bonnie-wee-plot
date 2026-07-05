/**
 * Leafy Greens — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  GARDEN_ORGANIC_STORING,
  UMN_SAUERKRAUT,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
} from '../resources'

export const leafyGreensPreservation: PreservationGuide[] = [
  {
    plantId: 'lettuce',
    summary:
      'Lettuce does not preserve — sow little and often, eat it fresh, and braise or blitz the bolters into soup.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick in the cool of the morning and eat the same day for the best crunch. Cut-and-come-again varieties keep producing if you take outer leaves only.',
        storageLife: 'best eaten the day it is picked',
      },
      {
        method: 'fridge',
        how: 'Wash, spin dry and keep in a box or bag with a sheet of kitchen paper to catch the damp. Whole heads keep longer than loose leaves.',
        storageLife: '5–7 days',
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('lettuce', 'Lettuce'),
      bbcGoodFoodCollection('salad-recipes', 'Salad recipes'),
    ],
  },
  {
    plantId: 'spinach',
    summary:
      'Wilts within days but freezes brilliantly — a spring glut becomes a freezer drawer of green portions for curries and pies.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young leaves and eat within a day or two — spinach loses sweetness fast off the plant.',
        storageLife: '2–3 days',
      },
      {
        method: 'fridge',
        how: 'Store unwashed in a loose bag in the salad drawer and wash just before use.',
        storageLife: '3–5 days',
      },
      {
        method: 'freeze',
        how: 'Blanch for 1–2 minutes, cool in iced water, squeeze into fist-sized balls and bag them. One ball is a portion for a curry or pie filling.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('spinach', 'Spinach'),
      bbcGoodFoodCollection('spinach-recipes', 'Spinach recipes'),
    ],
  },
  {
    plantId: 'perpetual-spinach',
    summary:
      'A leaf beet that crops for months — pick as you need it, and blanch-and-freeze whatever gets ahead of you.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in a loose bag in the salad drawer. It is tougher than true spinach and keeps a little longer.',
        storageLife: '5–7 days',
      },
      {
        method: 'freeze',
        how: 'Treat exactly like spinach: blanch for 2 minutes, squeeze dry and freeze in portion-sized balls. Cooked from frozen it is indistinguishable in pies and curries.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spinach', 'Spinach')],
  },
  {
    plantId: 'kale',
    summary:
      'The plot is the store — kale stands happily through a Scottish winter, so freeze only what you must.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave plants standing and pick leaves as needed right through winter — frost actually sweetens them. This beats any other storage method.',
        storageLife: 'in the ground all winter',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'Picked leaves keep in a bag in the salad drawer. Strip the tough midribs before cooking.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Strip out the midribs, blanch the leaves for 2 minutes, cool, squeeze and bag flat. Handy for soups and stews when the plot is under snow.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('kale', 'Kale'),
      bbcGoodFoodCollection('kale-recipes', 'Kale recipes'),
    ],
  },
  {
    plantId: 'cavolo-nero',
    summary:
      'Stands through winter like kale — pick fresh from the plant for months, freeze the surplus for ribollita.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave plants in the ground and pick from the bottom up all winter. The flavour deepens after frost.',
        storageLife: 'in the ground all winter',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'Keep picked leaves in a loose bag in the salad drawer, unwashed.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Strip the midribs, blanch 2 minutes, squeeze dry and freeze in bags pressed flat. Goes straight from freezer to soup pot.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('cavolo_nero', 'Cavolo nero')],
  },
  {
    plantId: 'chard',
    summary:
      'Two crops in one — freeze the leaves like spinach and treat the stems as a separate vegetable.',
    methods: [
      {
        method: 'fresh',
        how: 'Plants stand for months and often overwinter — pick outer leaves as needed and they keep coming.',
        storageLife: 'in the ground for months',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'Store unwashed in a loose bag. Leaves wilt before the stems do, so use leaves first.',
        storageLife: '4–7 days',
      },
      {
        method: 'freeze',
        how: 'Separate leaves from stems: blanch leaves 2 minutes and stems 3 minutes, then freeze in separate bags. Stems are lovely gratinated; leaves go in anything spinach would.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('chard', 'Chard')],
  },
  {
    plantId: 'rocket',
    summary:
      'A fast, peppery salad leaf that does not keep — eat it fresh, and blitz a bolting patch into pesto for the freezer.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young leaves before the plant bolts and eat the same day — the pepper builds as leaves age.',
        storageLife: 'best the day it is picked',
      },
      {
        method: 'fridge',
        how: 'Wash, dry well and keep in a box with kitchen paper in the salad drawer.',
        storageLife: '3–5 days',
      },
      {
        method: 'freeze',
        how: 'Blitz a glut into a rocket pesto with oil, nuts and cheese, and freeze in ice-cube trays. Raw leaves do not freeze, but the pesto keeps the pepper.',
        storageLife: '3–6 months frozen as pesto',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('rocket', 'Rocket')],
  },
  {
    plantId: 'pak-choi',
    summary:
      'Best straight into the wok — and the classic base for a kimchi-style ferment when a sowing all hearts up at once.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep whole heads unwashed in a loose bag in the salad drawer. Baby heads wilt faster than full-sized ones.',
        storageLife: '4–7 days',
      },
      {
        method: 'ferment',
        how: 'Salt quartered heads, rinse, then pack with chilli, garlic and ginger paste for a kimchi-style ferment. Keep everything under the brine and ferment cool for a few days before moving to the fridge.',
        storageLife: 'several months in the fridge',
        resources: [UMN_SAUERKRAUT, NCHFP.fermenting],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('pak_choi', 'Pak choi'),
      bbcGoodFoodCollection('kimchi-recipes', 'Kimchi recipes'),
    ],
  },
  {
    plantId: 'mizuna',
    summary:
      'A cut-and-come-again winter salad — the plant itself is the store, so pick small and often.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut leaves as needed and the stumps resprout for weeks — under a cloche it crops most of the winter.',
        storageLife: 'cut-and-come-again for weeks',
      },
      {
        method: 'fridge',
        how: 'Wash, dry thoroughly and keep in a box lined with kitchen paper. Larger leaves also wilt nicely into stir-fries.',
        storageLife: '4–5 days',
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('salad_leaves', 'Salad leaves'),
      bbcGoodFoodCollection('stir-fry-recipes', 'Stir-fry recipes'),
    ],
  },
  {
    plantId: 'land-cress',
    summary:
      'A hardy watercress stand-in that crops through winter — treat the bed as the larder and pick as needed.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick outer leaves as needed — plants stand through frost and keep producing where watercress would sulk.',
        storageLife: 'in the ground through winter',
      },
      {
        method: 'fridge',
        how: 'Keep in a loose bag in the salad drawer and use within a few days. Older, hotter leaves are better cooked into soup than eaten raw.',
        storageLife: '3–4 days',
      },
    ],
    recipeIdeas: [bbcFoodIngredient('watercress', 'Watercress')],
  },
  {
    plantId: 'corn-salad',
    summary:
      'The classic winter salad standby — it does not store, but then it does not need to, cropping outdoors when little else will.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut whole rosettes at soil level as needed through autumn and winter. The plants shrug off frost, so harvest to order.',
        storageLife: 'in the ground all winter',
      },
      {
        method: 'fridge',
        how: 'Wash carefully — the rosettes trap grit — dry well and keep in a box with kitchen paper.',
        storageLife: '4–5 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('winter-salad-recipes', 'Winter salad recipes')],
  },
  {
    plantId: 'winter-purslane',
    summary:
      'A succulent winter salad that laughs at frost — pick fresh all season rather than trying to store it.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut leaves and stems as needed from autumn to spring — it regrows quickly and even the flowers are edible.',
        storageLife: 'cut-and-come-again all winter',
      },
      {
        method: 'fridge',
        how: 'The fleshy leaves hold up better than lettuce in the fridge. Keep washed and dried in a lidded box.',
        storageLife: '4–5 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('winter-salad-recipes', 'Winter salad recipes')],
  },
  {
    plantId: 'mustard-greens',
    summary:
      'Hot leaves that mellow with cooking — freeze the big autumn flush and ferment a batch into a fiery kimchi.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in a loose bag in the salad drawer. Small leaves for salads, big ones for the pan.',
        storageLife: '5–7 days',
      },
      {
        method: 'freeze',
        how: 'Blanch whole leaves for 2 minutes, squeeze dry and freeze in portions. Freezing tames the heat — good in dals and stir-fries.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'ferment',
        how: 'Salt-wilt the leaves, then ferment with garlic, ginger and chilli for a mustard-green kimchi. Keep the leaves submerged and ferment cool before refrigerating.',
        storageLife: 'several months in the fridge',
        resources: [UMN_SAUERKRAUT, NCHFP.fermenting],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('mustard_leaves', 'Mustard leaves'),
      bbcGoodFoodCollection('kimchi-recipes', 'Kimchi recipes'),
    ],
  },
  {
    plantId: 'watercress',
    summary:
      'Fades fast once picked — eat it within days, and turn any surplus into soup for the freezer.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick just before eating. Stems stood in a jar of water on the windowsill stay perky for a day or two.',
        storageLife: '1–2 days',
      },
      {
        method: 'fridge',
        how: 'Keep bunched stems in a jar of water in the fridge, loosely covered with a bag, and change the water daily.',
        storageLife: '3–4 days',
      },
      {
        method: 'freeze',
        how: 'Raw leaves collapse when frozen, so cook a glut into watercress soup and freeze that in tubs instead.',
        storageLife: '3–6 months frozen as soup',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('watercress', 'Watercress')],
  },
  {
    plantId: 'salad-burnet',
    summary:
      'An evergreen cucumber-flavoured herb-cum-salad-leaf — the plant stores itself, staying green through most winters.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick the young ferny leaves as needed year-round — old leaves turn bitter, so keep cutting to force new growth.',
        storageLife: 'evergreen — pick year-round',
      },
      {
        method: 'fridge',
        how: 'Keep sprigs in a lidded box with damp kitchen paper. Use in salads, soft cheeses and summer drinks within a few days.',
        storageLife: '3–4 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('salad-recipes', 'Salad recipes')],
  },
  {
    plantId: 'orache',
    summary:
      'Mountain spinach in name and in the kitchen — eat the young leaves fresh and blanch-and-freeze the summer surplus.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep picked leaves unwashed in a loose bag in the salad drawer and use within a few days.',
        storageLife: '4–5 days',
      },
      {
        method: 'freeze',
        how: 'Treat like spinach: blanch for 1–2 minutes, squeeze dry and freeze in balls. It holds its colour well — the red varieties do bleed a little.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spinach', 'Spinach')],
  },
  {
    plantId: 'new-zealand-spinach',
    summary:
      'A sprawling summer spinach substitute that keeps cropping in heat — cook it before eating, and freeze it the same way.',
    methods: [
      {
        method: 'fridge',
        how: 'The fleshy leaves keep better than true spinach — store unwashed in a loose bag in the salad drawer.',
        storageLife: '5–7 days',
      },
      {
        method: 'freeze',
        how: 'Always blanch before freezing — 2 minutes, then squeeze dry and bag in portions. Blanching also deals with the oxalates, so do not skip it.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spinach', 'Spinach')],
  },
  {
    plantId: 'good-king-henry',
    summary:
      'A perennial spinach for the margins — spring shoots are the prize, and the leaf glut freezes like any other pot herb.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep picked shoots and leaves in a loose bag in the salad drawer. Young growth is far better than the bitter older leaves.',
        storageLife: '5–7 days',
      },
      {
        method: 'freeze',
        how: 'Blanch leaves for 2 minutes, squeeze and freeze in balls like spinach. The asparagus-like spring shoots can be blanched 2–3 minutes and frozen too.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('spinach', 'Spinach')],
  },
  {
    plantId: 'radicchio',
    summary:
      'The best-keeping salad on the plot — tight winter heads sit happily in the fridge for weeks.',
    methods: [
      {
        method: 'fresh',
        how: 'Hardy varieties stand outside well into winter — leave heads on the plant and cut as needed.',
        storageLife: 'in the ground into winter',
      },
      {
        method: 'fridge',
        how: 'Cut whole heads, strip the ragged outer leaves and keep wrapped in the salad drawer. Peel off leaves as you need them and the heart keeps on.',
        storageLife: '2–3 weeks',
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('radicchio', 'Radicchio'),
      bbcGoodFoodCollection('winter-salad-recipes', 'Winter salad recipes'),
    ],
  },
  {
    plantId: 'endive',
    summary:
      'A bitter autumn salad that keeps better than lettuce — blanch heads under a pot for a sweeter heart, then fridge them whole.',
    methods: [
      {
        method: 'fresh',
        how: 'Cover a maturing head with a plate or flowerpot for 10 days before cutting to blanch the heart pale and mild. Cut as needed — plants stand well in autumn.',
        storageLife: 'stands in the ground through autumn',
      },
      {
        method: 'fridge',
        how: 'Keep whole heads wrapped in the salad drawer and strip leaves as needed. Bitter outer leaves are good braised or grilled rather than binned.',
        storageLife: '1–2 weeks',
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('endive', 'Endive'),
      bbcGoodFoodCollection('winter-salad-recipes', 'Winter salad recipes'),
    ],
  },
  {
    plantId: 'ice-plant',
    summary:
      'Grown for its crunchy, salty, frosted-looking leaves — strictly an eat-fresh crop, picked as you need it.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young leaves and stem tips as needed through summer — regular picking keeps the plant producing. The salty crunch is the whole point, so eat soon after cutting.',
        storageLife: 'best the day it is picked',
      },
      {
        method: 'fridge',
        how: 'The succulent leaves hold their crunch for a few days in a lidded box in the salad drawer — no washing until you use them.',
        storageLife: '3–4 days',
      },
    ],
    recipeIdeas: [bbcGoodFoodCollection('salad-recipes', 'Salad recipes')],
  },
]
