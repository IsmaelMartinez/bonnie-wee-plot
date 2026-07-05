import { describe, it, expect } from 'vitest'
import { vegetables } from '@/lib/vegetable-database'
import { preservationGuides } from '@/lib/preservation'
import { PRESERVE_METHODS } from '@/lib/task-generator'

/**
 * Crops whose PreservationGuide is still to be authored. Each parallel
 * authoring session (see src/lib/preservation/data/README.md) removes its
 * crops from this list as it fills its data file — the "no stale entries"
 * test below fails if an authored crop is left behind here. When the list is
 * empty, delete it and inline `[]`.
 *
 * Grouped by authoring session for easy removal; the grouping comments are
 * navigational only (e.g. radish lives in the root-vegetables session even
 * though its database category is brassicas).
 */
const PENDING_GUIDES = new Set<string>([
  // root-vegetables session
  'beetroot',
  'radish',
  'mooli',
  'horseradish',
  // brassicas session
  'cabbage',
  'broccoli',
  'purple-sprouting-broccoli',
  'cauliflower',
  'brussels-sprouts',
  'kohlrabi',
  'savoy-cabbage',
  'red-cabbage',
  'chinese-broccoli',
  'romanesco',
  'turnip-tops',
  // legumes session
  'peas',
  'runner-beans',
  'broad-beans',
  'french-beans',
  'climbing-french-beans',
  'borlotti-beans',
  'edamame',
  'mangetout',
  'sugar-snap-peas',
  'asparagus-peas',
  'black-turtle-beans',
  'fenugreek',
  // solanaceae session
  'cherry-tomato',
  'plum-tomato',
  'blight-resistant-tomato',
  'tomatillo',
  // alliums session
  'spring-onion',
  'welsh-onion',
  'garlic-chives',
  'ramps',
  // herbs session
  'parsley',
  'coriander',
  'mint',
  'thyme',
  'rosemary',
  'chives',
  'lovage',
  'sorrel',
  'oregano',
  'sage',
  'french-tarragon',
  'dill',
  'herb-fennel',
  'lemon-balm',
  'marjoram',
  'bay',
  'chamomile',
  'winter-savory',
  'hyssop',
  // berries session
  'strawberry',
  'raspberry',
  'blackcurrant',
  'redcurrant',
  'gooseberry',
  'blueberry',
  'blackberry',
  'tayberry',
  'loganberry',
  'jostaberry',
  'honeyberry',
  'goji-berry',
  'aronia',
  'elderberry',
  'sea-buckthorn',
  // fruit-trees session
  'apple-tree',
  'pear-tree',
  'plum-tree',
  'cherry-tree',
  'damson-tree',
  'greengage-tree',
  'medlar-tree',
  'quince-tree',
  'fig-tree',
  'mulberry-tree',
  // other + mushrooms + edible-extras session
  'sweetcorn',
  'asparagus',
  'globe-artichoke',
  'rhubarb',
  'celery',
  'oyster-mushroom',
  'shiitake',
  'nasturtium',
  'calendula',
  'lavender',
  'bergamot',
  'hardy-kiwi',
  'hops',
  'sunflower',
])

describe('Preservation guide coverage', () => {
  const preserveMethodSet = new Set(PRESERVE_METHODS)
  const preserveCrops = vegetables.filter(v =>
    v.storage?.methods.some(m => preserveMethodSet.has(m))
  )
  const covered = new Set(preservationGuides.map(g => g.plantId))

  it('every crop with a preserve storage method has a guide (or is pending authoring)', () => {
    const missing = preserveCrops
      .filter(v => !covered.has(v.id) && !PENDING_GUIDES.has(v.id))
      .map(v => v.id)
    expect(
      missing,
      'These crops advertise a preserve method (freeze/jam/pickle/ferment/dry) in ' +
        'Vegetable.storage but have no PreservationGuide. Author one in ' +
        'src/lib/preservation/data/ following data/README.md.'
    ).toEqual([])
  })

  it('pending list has no stale entries for crops that now have guides', () => {
    const stale = [...PENDING_GUIDES].filter(id => covered.has(id))
    expect(
      stale,
      'These crops have guides now — remove them from PENDING_GUIDES in this test.'
    ).toEqual([])
  })

  it('pending list only contains real crops with a preserve storage method', () => {
    const preserveIds = new Set(preserveCrops.map(v => v.id))
    const bogus = [...PENDING_GUIDES].filter(id => !preserveIds.has(id))
    expect(
      bogus,
      'These PENDING_GUIDES entries are not preserve-method crops (typo or storage data changed).'
    ).toEqual([])
  })

  it('the coverage check is non-vacuous', () => {
    expect(preserveCrops.length).toBeGreaterThan(50)
    expect(covered.size).toBeGreaterThan(0)
  })
})
