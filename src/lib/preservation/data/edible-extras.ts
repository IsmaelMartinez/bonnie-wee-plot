/**
 * Edible extras — Preserving guides
 * Edible flowers and climbers that sit outside the vegetable/fruit categories.
 * Authoring spec: ./README.md
 */

import { PreservationGuide } from '@/types/preservation'
import { NCHFP, BBC_GOOD_FOOD, bbcFoodIngredient } from '../resources'

export const edibleExtrasPreservation: PreservationGuide[] = [
  {
    plantId: 'nasturtium',
    summary:
      'Leaves and flowers are strictly eat-fresh; the green seed pods pickle into poor mans capers that keep all winter.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick leaves and flowers just before eating — they wilt within hours. A short spell in a bag in the fridge with a damp towel buys a day or two at most.',
        storageLife: '1–3 days at best',
      },
      {
        method: 'pickle',
        how: 'Gather plump green seed pods, brine them for a day, then jar in cold spiced vinegar — the classic poor mans capers. Give them a few weeks to mellow before opening.',
        storageLife: '6–12 months in sealed jars',
        resources: [NCHFP.pickling],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('nasturtium', 'Nasturtium')],
  },
  {
    plantId: 'calendula',
    summary:
      'Petals scatter fresh over summer salads and dry easily for tea and winter colour in the store cupboard.',
    methods: [
      {
        method: 'fresh',
        how: 'Pull petals from freshly opened heads and use the same day over salads, rice and bakes. The green flower base is bitter — petals only.',
        storageLife: 'use the day of picking',
      },
      {
        method: 'dry',
        how: 'Pick whole heads on a dry morning, pull the petals and dry them on paper somewhere warm and airy out of direct sun. Store airtight in the dark for tea or as a saffron-coloured kitchen stand-in.',
        storageLife: '6–12 months airtight in the dark',
        resources: [NCHFP.drying],
      },
    ],
  },
  {
    plantId: 'lavender',
    summary:
      'Cut just as the flowers open and dry in bunches — a jar of dried buds covers baking, tea and sleep sachets for the year.',
    methods: [
      {
        method: 'fresh',
        how: 'Fresh sprigs flavour sugar, shortbread and cordials — use sparingly, as a little goes a long way. Stems keep a few days in water.',
        storageLife: 'a few days in water',
      },
      {
        method: 'dry',
        how: 'Cut stems as the first flowers open, hang in small bunches upside down somewhere warm, dark and airy for 2–4 weeks, then rub the buds off into a jar. Culinary varieties (English lavender) taste best.',
        storageLife: '1 year+ airtight in the dark',
        resources: [NCHFP.drying],
      },
    ],
  },
  {
    plantId: 'bergamot',
    summary:
      'Bee balm is a tea crop at heart — dry leaves and flowers for a bergamot-scented brew, and freeze chopped leaves for cooking.',
    methods: [
      {
        method: 'fresh',
        how: 'Pick young leaves and fresh flowers for salads and tea as you need them. Sprigs keep a couple of days in a glass of water.',
        storageLife: '2–3 days in water',
      },
      {
        method: 'dry',
        how: 'Hang stems in small bunches or dry leaves and petals flat somewhere warm and airy, then crumble into jars. The Earl-Grey-like scent holds well dried — this is the winter tea supply.',
        storageLife: '6–12 months airtight in the dark',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Chop fresh leaves and freeze in ice-cube trays topped up with water, then bag the cubes for teas and summer drinks.',
        storageLife: '6–12 months frozen',
        resources: [NCHFP.freezing],
      },
    ],
  },
  {
    plantId: 'hardy-kiwi',
    summary:
      'The grape-sized fruits ripen in a rush — fridge the firm ones, freeze the ripe ones whole, and jam the rest.',
    methods: [
      {
        method: 'fridge',
        how: 'Pick firm and ripen a few at a time in the fruit bowl; the rest keep weeks in the fridge. Bring out batches as you need them — they soften in a day or two at room temperature.',
        storageLife: '2–6 weeks in the fridge picked firm',
      },
      {
        method: 'freeze',
        how: 'Open-freeze ripe fruits whole on a tray — no peeling needed, the skins are smooth — then bag. Eat half-thawed like little sorbets or blitz into smoothies.',
        storageLife: '10–12 months frozen',
        resources: [NCHFP.freezing],
      },
      {
        method: 'jam',
        how: 'A glut cooks down into a sharp green jam — halve the fruits and simmer with sugar and a squeeze of lemon. Low in pectin, so use jam sugar for a set.',
        storageLife: '1 year+ in sealed jars',
        resources: [NCHFP.jams, BBC_GOOD_FOOD.jams],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('kiwi_fruit', 'Kiwi fruit')],
  },
  {
    plantId: 'hops',
    summary:
      'A brewing crop — dry the cones fast after picking and get them airtight or frozen before the aroma fades.',
    methods: [
      {
        method: 'dry',
        how: 'Pick cones when papery and springy, then dry in a thin layer somewhere warm and airy (or a dehydrator on low) for a day or two until the central stem snaps. Store airtight in the dark — light and air kill the aroma.',
        storageLife: '6–12 months airtight; longer if also frozen',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Vacuum-pack or tightly bag the dried cones and freeze — the brewers trick for keeping the bittering oils fresh between harvests. Fresh cones can also go straight in the freezer for a green-hop brew.',
        storageLife: '1–2 years frozen airtight',
        resources: [NCHFP.freezing],
      },
    ],
  },
  {
    plantId: 'sunflower',
    summary:
      'One good head gives a jarful of seeds — dry them hard for the cupboard, and freeze what you shell for the long haul.',
    methods: [
      {
        method: 'dry',
        how: 'Cut heads when the backs turn brown and yellow, hang somewhere dry and airy (netted against birds and mice), then rub out the seeds and dry them fully before jarring. Roast salted for snacking or keep raw for sowing and porridge.',
        storageLife: '2–3 months at room temperature; longer kept cool',
        resources: [NCHFP.drying],
      },
      {
        method: 'freeze',
        how: 'Shelled seeds go rancid at room temperature within a few months — bag them airtight and freeze for the long haul.',
        storageLife: 'about 1 year frozen',
        resources: [NCHFP.freezing],
      },
    ],
    recipeIdeas: [bbcFoodIngredient('sunflower_seed', 'Sunflower seed')],
  },
]
