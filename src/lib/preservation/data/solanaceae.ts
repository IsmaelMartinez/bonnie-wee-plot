/**
 * Solanaceae — Preserving guides
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
} from '../resources'

export const solanaceaePreservation: PreservationGuide[] = [
  {
    plantId: 'potato',
    summary:
      'The all-purpose tattie — dry off well and store dark in paper sacks; never the fridge, which turns them sweet.',
    methods: [
      {
        method: 'cure',
        how: 'Cut the haulms and leave the tubers in the ground for 1–2 weeks to set the skins, then lift on a dry day and let them dry on the surface for a few hours before sacking.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Store unwashed in paper or hessian sacks somewhere cool, dark and frost-free — never plastic and never the fridge. Check monthly and pull out anything soft or sprouting.',
        storageLife: '2–6 months depending on type',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Potatoes only freeze cooked — blanch chips for 2–3 minutes, or freeze mash and par-roasted tatties in meal-sized portions.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('potato', 'Potato'),
      bbcGoodFoodCollection('potato-recipes', 'Potato recipes'),
    ],
  },
  {
    plantId: 'early-potato',
    summary:
      'New tatties are for eating, not keeping — dig only what you need and get them to the pot the same day.',
    methods: [
      {
        method: 'fresh',
        how: 'The ground is their best store — leave the rest growing and lift as you go. Flavour is sweetest within hours of digging.',
        storageLife: 'a few days after lifting',
      },
      {
        method: 'fridge',
        how: 'If you dug too many, keep them unwashed in a paper bag in the fridge. This is the one exception to the no-fridge rule for tatties, and it buys days, not weeks.',
        storageLife: 'up to a week',
      },
      {
        method: 'freeze',
        how: 'Parboil small whole tubers for 2–3 minutes, cool and freeze — fine later for crushing and frying, though never quite the same as fresh-dug.',
        storageLife: '8–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('new_potatoes', 'New potatoes'),
      bbcGoodFoodCollection('new-potato-recipes', 'New potato recipes'),
    ],
  },
  {
    plantId: 'second-early-potato',
    summary:
      'The in-betweener — bigger yields than first earlies but still a short keeper; think weeks, not months.',
    methods: [
      {
        method: 'fresh',
        how: 'Lift as needed through July and August and eat within a fortnight — they are at their best straight from the ground.',
        storageLife: 'about 2 weeks',
      },
      {
        method: 'store-cool',
        how: 'Any surplus keeps a few weeks unwashed in a paper sack somewhere cool and dark, but plan meals around them — the skins are too thin for proper winter storage.',
        storageLife: '4–6 weeks',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'freeze',
        how: 'Blanch chips or cook and mash before freezing — a good home for any that will not get eaten in time.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('new_potatoes', 'New potatoes'),
      bbcGoodFoodCollection('potato-recipes', 'Potato recipes'),
    ],
  },
  {
    plantId: 'maincrop-potato',
    summary:
      'The keeper of the four — cure the skins hard and a good sack of maincrops feeds you until spring.',
    methods: [
      {
        method: 'cure',
        how: 'Cut the haulms about 2 weeks before lifting so the skins set, lift on a dry day, and leave the tubers on the surface for a few hours to dry. Thick set skins are what make them keep.',
        resources: [GARDEN_ORGANIC_STORING],
      },
      {
        method: 'store-cool',
        how: 'Sack up unwashed in paper or hessian and store cool, dark and frost-free — 5–10°C in a shed or garage is ideal, and the fridge is too cold. Check monthly and remove anything soft, green or sprouting.',
        storageLife: '4–6 months',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Blanched chips, mash and roasties all freeze well — the right use for forked or damaged tubers that would rot in the sack.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('potato', 'Potato'),
      bbcGoodFoodCollection('potato-recipes', 'Potato recipes'),
    ],
  },
  {
    plantId: 'cherry-tomato',
    summary:
      'A proper glut in any good year — eat from the vine, then freeze whole or oven-dry the rest.',
    methods: [
      {
        method: 'fresh',
        how: 'Ripen and keep on the worktop, not the fridge — cold dulls the flavour. Eat within the week.',
        storageLife: 'about 1 week at room temperature',
      },
      {
        method: 'fridge',
        how: 'Fully ripe fruit holds a few extra days in the salad drawer. Bring back to room temperature before eating to recover the flavour.',
        storageLife: 'a few extra days',
      },
      {
        method: 'freeze',
        how: 'Freeze whole on a tray, then bag. The skins slip off under a warm tap and they drop straight into winter sauces and stews.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Halve, salt lightly and semi-dry in the oven at 100°C for 3–4 hours. Semi-dried tomatoes are not shelf-stable — keep them in the freezer, not in oil in the cupboard.',
        storageLife: '6 months frozen once semi-dried',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('cherry_tomatoes', 'Cherry tomatoes'),
      bbcGoodFoodCollection('cherry-tomato-recipes', 'Cherry tomato recipes'),
    ],
  },
  {
    plantId: 'plum-tomato',
    summary:
      'The sauce tomato — cook the glut into passata for the freezer, and turn the green stragglers into chutney.',
    methods: [
      {
        method: 'fresh',
        how: 'Ripen on the worktop and use within the week. Green fruit ripens slowly indoors next to a banana.',
        storageLife: 'about 1 week at room temperature',
      },
      {
        method: 'freeze',
        how: 'Cook down into passata and freeze in tubs, or freeze whole on trays for later. Home-canned tomatoes need added acid to be safe, so the freezer is the simpler route for passata.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing, NCHFP.canning],
      },
      {
        method: 'dry',
        how: 'Halve lengthways, scoop the seeds and slow-dry at 100°C — the dense flesh of plum varieties dries best of all. Store fully dried in jars, or semi-dried in the freezer.',
        storageLife: '6–12 months dried',
        resources: [NCHFP.drying],
      },
      {
        method: 'jam',
        how: 'Green tomato chutney is the classic end-of-season answer for fruit that will not ripen — chop, then simmer with onions, vinegar, sugar and spice.',
        storageLife: '1 year+ in sealed jars',
        resources: [BBC_GOOD_FOOD.chutneys],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('tomato', 'Tomato'),
      bbcGoodFoodCollection('tomato-recipes', 'Tomato recipes'),
    ],
  },
  {
    plantId: 'blight-resistant-tomato',
    summary:
      'Bred to keep cropping through a damp Scottish autumn — so expect a bigger, later glut to freeze, dry and sauce.',
    methods: [
      {
        method: 'fresh',
        how: 'Keep ripe fruit on the worktop and eat within the week. Anything still green at the end of the season ripens indoors, or goes in the chutney pan.',
        storageLife: 'about 1 week at room temperature',
      },
      {
        method: 'fridge',
        how: 'Fully ripe fruit holds a few extra days in the fridge — bring it back to room temperature before eating.',
        storageLife: 'a few extra days',
      },
      {
        method: 'freeze',
        how: 'Freeze whole on trays or cook down into sauce and passata for tubs. Skip home canning unless you know the added-acid rules — freezing is the safe, easy route.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'dry',
        how: 'Halve and semi-dry in a low oven at 100°C for 3–4 hours, then store in the freezer — intensely flavoured and ready for winter pastas.',
        storageLife: '6 months frozen once semi-dried',
        resources: [NCHFP.drying],
      },
    ],
    recipeIdeas: [
      bbcFoodIngredient('tomato', 'Tomato'),
      bbcGoodFoodCollection('tomato-recipes', 'Tomato recipes'),
    ],
  },
  {
    plantId: 'tomatillo',
    summary:
      'Keeps for weeks in its papery husk — and the surest route to a Scottish salsa verde is the freezer.',
    methods: [
      {
        method: 'fridge',
        how: 'Leave the husks on and keep loose in the fridge — they hold far longer than a tomato. Husk and rinse the sticky coating off just before use.',
        storageLife: '2–3 weeks',
      },
      {
        method: 'store-cool',
        how: 'Husks on and spread in a single layer somewhere cool and airy, they keep a few weeks out of the fridge too. Check for any turning soft under the husk.',
        storageLife: '2–3 weeks',
        resources: [UMN_HARVEST_STORAGE],
      },
      {
        method: 'freeze',
        how: 'Husk, rinse and freeze whole on a tray before bagging — or roast and blitz into salsa verde first and freeze that in tubs.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('tomatillo', 'Tomatillo')],
  },
]
