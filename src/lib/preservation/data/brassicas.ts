/**
 * Brassicas — Preserving guides
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import {
  NCHFP,
  GARDEN_ORGANIC_STORING,
  UMN_HARVEST_STORAGE,
  UMN_SAUERKRAUT,
  BBC_GOOD_FOOD,
  bbcFoodDish,
  bbcFoodIngredient,
  bbcGoodFoodCollection,
  bbcGoodFoodRecipe,
} from '../resources'

export const brassicasPreservation: PreservationGuide[] = [
  {
    plantId: 'broccoli',
    summary:
      'Heads all come at once — eat the main head fresh, blanch and freeze the rest before the buds open.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep unwashed in a loose bag in the salad drawer and eat within the week — the buds yellow fast once cut.',
        storageLife: 'up to 1 week',
      },
      {
        method: 'freeze',
        how: 'Cut into even florets, blanch 3 minutes, cool in iced water and freeze flat on a tray before bagging. Soak in salted water first to evict any caterpillars.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('broccoli', 'Broccoli'),
      bbcGoodFoodCollection('broccoli-recipes', 'Broccoli recipes'),
      bbcGoodFoodRecipe('broccoli-stilton-soup', 'Broccoli & stilton soup'),
    ],
  },
  {
    plantId: 'cabbage',
    summary:
      'The great keeper of the plot — solid heads store for months in a cool shed, and the surplus makes sauerkraut.',
    methods: [
      {
        method: 'fridge',
        how: 'A whole head keeps for weeks in the fridge; wrap a cut face in a bag and use within days.',
        storageLife: '2–4 weeks whole in the fridge',
      },
      {
        method: 'store-cool',
        how: 'Lift solid winter heads with a stub of stem, strip loose leaves, and store cool and frost-free — netted, on slatted shelves, or nested in straw. Check monthly and peel off any spoiled outer leaves.',
        storageLife: '2–4 months in a cool store',
        resources: [GARDEN_ORGANIC_STORING, UMN_HARVEST_STORAGE],
      },
      {
        method: 'ferment',
        how: 'Shred, salt at 2–2.5% by weight, pack tight under its own brine and let it work at room temperature for 1–4 weeks. Keep everything below the brine and it looks after itself.',
        storageLife: 'several months refrigerated once fermented',
        resources: [UMN_SAUERKRAUT, NCHFP.fermenting],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('cabbage', 'Cabbage'),
      bbcGoodFoodRecipe('bubble-squeak', 'Bubble & squeak'),
      bbcFoodDish('coleslaw', 'Coleslaw'),
    ],
  },
  {
    plantId: 'cauliflower',
    summary:
      'Curds refuse to stagger themselves — freeze florets for the freezer and pickle the rest as piccalilli.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep the whole head unwashed in a bag in the fridge, leaves on to protect the curd.',
        storageLife: 'up to 1 week',
      },
      {
        method: 'freeze',
        how: 'Break into walnut-sized florets, blanch 3 minutes, cool and open-freeze on a tray before bagging. Frozen cauliflower goes soft — save it for soup, curry and cauliflower cheese.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'Brine small florets overnight, then pack in spiced vinegar — the backbone of a proper piccalilli along with any spare beans and onions.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling, BBC_GOOD_FOOD.pickles],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('cauliflower', 'Cauliflower'),
      bbcFoodDish('cauliflower_cheese', 'Cauliflower cheese'),
      bbcFoodDish('piccalilli', 'Piccalilli'),
    ],
  },
  {
    plantId: 'brussels-sprouts',
    summary:
      'The plant is its own larder — leave sprouts standing through the frosts and pick as needed, freezing any big flush.',
    methods: [
      {
        method: 'fresh',
        how: 'Leave them on the plant and pick from the bottom up as they firm — frost sweetens them. A whole cut stalk stands for a week or two in a cold shed or bucket of water.',
        storageLife: 'standing on the plant all winter',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'fridge',
        how: 'Picked sprouts keep unwashed in a bag in the salad drawer.',
        storageLife: 'about 1 week',
      },
      {
        method: 'freeze',
        how: 'Trim, blanch small sprouts 3 minutes and larger ones 4–5, cool fast and open-freeze on a tray before bagging.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('brussels_sprouts', 'Brussels sprouts'),
      bbcGoodFoodRecipe('bubble-squeak', 'Bubble & squeak'),
    ],
  },
  {
    plantId: 'kohlrabi',
    summary:
      'Pick at tennis-ball size for eating fresh — the late ones store like a root crop in damp sand.',
    methods: [
      {
        method: 'fridge',
        how: 'Twist off the leaves and keep the bulbs in a bag in the salad drawer — they hold their crunch for weeks.',
        storageLife: '2–4 weeks',
      },
      {
        method: 'store-cool',
        how: 'Late sowings can be lifted, topped and packed in boxes of just-damp sand in a cool shed, same as carrots and beetroot.',
        storageLife: '1–2 months in sand',
        resources: [GARDEN_ORGANIC_STORING, UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Peel, cube, blanch 2–3 minutes and freeze in bags — destined for soups and stews rather than salads.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('kohlrabi', 'Kohlrabi'),
      bbcGoodFoodCollection('kohlrabi-recipes', 'Kohlrabi recipes'),
      bbcFoodDish('coleslaw', 'Coleslaw'),
    ],
  },
  {
    plantId: 'savoy-cabbage',
    summary:
      'The hardiest cabbage on the plot — leave it standing through winter and cut heads as you need them.',
    methods: [
      {
        method: 'fresh',
        how: 'Savoys shrug off Scottish frost — leave them in the ground and cut fresh from November to March. That is the whole storage plan for most plots.',
        storageLife: 'standing in the ground all winter',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'If the bed is needed, lift whole heads with roots on and hang or shelve them somewhere cold and frost-free.',
        storageLife: '3–6 weeks lifted',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Shred, blanch 90 seconds, cool and bag in meal-sized portions for winter soups and stovies.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('savoy_cabbage', 'Savoy cabbage'),
      bbcGoodFoodRecipe('rumbledethumps', 'Rumbledethumps'),
    ],
  },
  {
    plantId: 'red-cabbage',
    summary:
      'The pickling cabbage — solid heads keep for months in a cool store, and jars of spiced pickled red cabbage see you to Christmas and beyond.',
    methods: [
      {
        method: 'fridge',
        how: 'A dense head keeps for weeks in the fridge; bag any cut face and use it within days.',
        storageLife: '3–4 weeks whole in the fridge',
      },
      {
        method: 'store-cool',
        how: 'Red cabbage is one of the best storing brassicas — lift solid heads, strip loose leaves and keep cool, dry and frost-free on slatted shelves.',
        storageLife: '2–4 months in a cool store',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'pickle',
        how: 'Shred finely, dry-salt for 24 hours, rinse and pack in spiced vinegar. Ready in a week and a classic with cold meat and cheese.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling, BBC_GOOD_FOOD.pickles],
      },
      {
        method: 'ferment',
        how: 'Ferments exactly like white cabbage and turns a startling magenta — shred, salt at 2–2.5% and keep it under the brine.',
        storageLife: 'several months refrigerated once fermented',
        resources: [UMN_SAUERKRAUT],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('red_cabbage', 'Red cabbage'),
      bbcGoodFoodRecipe('braised-red-cabbage', 'Braised red cabbage'),
    ],
  },
  {
    plantId: 'chinese-broccoli',
    summary:
      'A cut-and-cook green — stems and leaves wilt fast, so eat within days and blanch-freeze any surplus.',
    methods: [
      {
        method: 'fridge',
        how: 'Stand the stems in a jar of water or bag them unwashed in the salad drawer, and cook within a few days.',
        storageLife: '4–5 days',
      },
      {
        method: 'freeze',
        how: 'Blanch whole stems 2 minutes, cool fast and freeze flat in bags — straight from freezer to stir-fry or steamer.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
  },
  {
    plantId: 'romanesco',
    summary:
      'Treat the fractal curds like cauliflower — eat the head fresh and blanch-freeze florets before they loosen.',
    methods: [
      {
        method: 'fridge',
        how: 'Keep the head whole and unwashed in a bag in the fridge, wrapper leaves on.',
        storageLife: 'up to 1 week',
      },
      {
        method: 'freeze',
        how: 'Break into florets, blanch 3 minutes, cool and open-freeze on a tray before bagging. Best used cooked — soups, gratins and pasta.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'pickle',
        how: 'The pointed florets pickle as well as cauliflower and look far better in the jar — brine overnight, then cover with spiced vinegar.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [
      bbcGoodFoodCollection('cauliflower-recipes', 'Cauliflower recipes (romanesco works the same)'),
    ],
  },
  {
    plantId: 'turnip-tops',
    summary:
      'A quick spring green with no shelf life to speak of — cook it fast or freeze it blanched like spinach.',
    methods: [
      {
        method: 'fridge',
        how: 'Bag the shoots unwashed and keep in the salad drawer — they flop within days, so cook them soon.',
        storageLife: '3–4 days',
      },
      {
        method: 'freeze',
        how: 'Blanch the shoots and leaves 2 minutes, cool in iced water, squeeze out and freeze in fist-sized balls — ready for pasta, orecchiette-style, or greens with garlic.',
        storageLife: '8–10 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
  },
  {
    plantId: 'mibuna',
    summary:
      'A cut-and-come-again mustard green — the plant in the ground is the store, with a kimchi-style ferment for any big cut.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick little and often straight into the salad bowl — the standing plant keeps far better than anything you cut.',
        storageLife: 'cut-and-come-again from the plant',
      },
      {
        method: 'fridge',
        how: 'Wash, spin dry and keep in a box or bag with a sheet of kitchen paper to catch the damp.',
        storageLife: '4–5 days',
      },
      {
        method: 'ferment',
        how: 'Like other mustard greens, mibuna takes well to a kimchi-style ferment — salt the leaves, add garlic, ginger and chilli, and keep everything under the brine.',
        storageLife: 'several months refrigerated once fermented',
        resources: [NCHFP.fermenting, UMN_SAUERKRAUT],
      },
    ],
  },
  {
    plantId: 'seakale',
    summary:
      'A forced spring delicacy — the blanched shoots are for eating within days, not preserving.',
    methods: [
      {
        method: 'fresh',
        how: 'Cut the forced shoots at 15–20cm and treat like asparagus — steam or butter-fry the same day for the true flavour.',
        storageLife: 'best eaten the day it is cut',
      },
      {
        method: 'fridge',
        how: 'Wrap the shoots in damp kitchen paper inside a bag and keep in the salad drawer — quality drops quickly.',
        storageLife: '2–3 days',
      },
    ],
  },
  {
    plantId: 'purple-sprouting-broccoli',
    summary:
      'The hungry-gap hero — pick spears every few days to keep them coming, and freeze the gluts blanched.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick the central spear first, then the side shoots every few days — regular picking keeps the plant producing for weeks. Best cooked the day it is cut.',
        storageLife: 'weeks of repeat picking from the plant',
      },
      {
        method: 'fridge',
        how: 'Stand spears in a jar of water like a bunch of flowers, or bag them unwashed in the salad drawer.',
        storageLife: '3–5 days',
      },
      {
        method: 'freeze',
        how: 'Blanch spears 2–3 minutes, cool fast and open-freeze on a tray before bagging so they stay loose.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('purple_sprouting_broccoli', 'Purple sprouting broccoli'),
    ],
  },
]
