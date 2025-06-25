'use client'

import Link from 'next/link'
import { Recycle, Leaf, Thermometer, Timer, Droplets, ArrowRight, Star, Info, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react'

const compostingMethods = [
  {
    method: 'Hot Composting',
    icon: Thermometer,
    timeframe: '3-6 months',
    difficulty: 'Intermediate',
    description: 'Fast decomposition through high temperatures (140-160°F).',
    materials: ['Browns: dry leaves, cardboard, paper', 'Greens: food scraps, grass clippings', 'Water', 'Air circulation'],
    steps: [
      'Build pile with 3:1 brown to green ratio',
      'Turn pile every 1-2 weeks',
      'Monitor temperature and moisture',
      'Harvest finished compost'
    ],
    pros: ['Fast results', 'Kills pathogens and weed seeds', 'Produces high-quality compost'],
    cons: ['Requires regular maintenance', 'Needs large amount of materials', 'Labor intensive']
  },
  {
    method: 'Cold Composting',
    icon: Timer,
    timeframe: '6-24 months',
    difficulty: 'Beginner',
    description: 'Slow, natural decomposition with minimal intervention.',
    materials: ['Kitchen scraps', 'Garden waste', 'Fallen leaves', 'Small amounts of water'],
    steps: [
      'Add materials as available',
      'Occasional turning (monthly)',
      'Keep pile moist',
      'Wait patiently for decomposition'
    ],
    pros: ['Low maintenance', 'No strict ratios required', 'Perfect for beginners'],
    cons: ['Takes longer', 'May not kill all weed seeds', 'Can attract pests if not managed']
  },
  {
    method: 'Vermicomposting',
    icon: RotateCcw,
    timeframe: '3-6 months',
    difficulty: 'Intermediate',
    description: 'Worms break down organic matter into rich worm castings.',
    materials: ['Red wiggler worms', 'Bedding (shredded paper)', 'Food scraps', 'Ventilated container'],
    steps: [
      'Set up worm bin with bedding',
      'Add worms and food scraps',
      'Maintain moisture and temperature',
      'Harvest worm castings regularly'
    ],
    pros: ['Compact system', 'Produces excellent fertilizer', 'Works year-round indoors'],
    cons: ['Requires worm care', 'Limited food waste capacity', 'Initial setup cost']
  }
]

const compostIngredients = {
  greens: [
    { item: 'Fruit and vegetable scraps', ratio: 'High nitrogen', notes: 'Chop large pieces for faster breakdown' },
    { item: 'Coffee grounds and filters', ratio: 'High nitrogen', notes: 'Great activator, use in moderation' },
    { item: 'Fresh grass clippings', ratio: 'High nitrogen', notes: 'Mix with browns to prevent matting' },
    { item: 'Fresh plant trimmings', ratio: 'High nitrogen', notes: 'Avoid diseased plants' },
    { item: 'Eggshells (crushed)', ratio: 'Moderate nitrogen', notes: 'Adds calcium, crush for faster breakdown' }
  ],
  browns: [
    { item: 'Dry leaves', ratio: 'High carbon', notes: 'Shred for faster decomposition' },
    { item: 'Cardboard and paper', ratio: 'High carbon', notes: 'Remove tape and staples, shred first' },
    { item: 'Straw and hay', ratio: 'High carbon', notes: 'Excellent for structure and aeration' },
    { item: 'Wood chips and sawdust', ratio: 'Very high carbon', notes: 'Use sparingly, can slow decomposition' },
    { item: 'Pine needles', ratio: 'High carbon', notes: 'Acidic, use in moderation' }
  ],
  avoid: [
    { item: 'Meat and fish', reason: 'Attracts pests and creates odors' },
    { item: 'Dairy products', reason: 'Can become rancid and attract rodents' },
    { item: 'Oils and fats', reason: 'Slow to decompose and can create anaerobic conditions' },
    { item: 'Pet waste', reason: 'May contain harmful pathogens' },
    { item: 'Diseased plants', reason: 'Can spread disease to finished compost' },
    { item: 'Weeds with seeds', reason: 'May survive and spread in garden' }
  ]
}

const troubleshootingGuide = [
  {
    problem: 'Pile smells bad',
    causes: ['Too much nitrogen (greens)', 'Too wet', 'Poor aeration'],
    solutions: ['Add more browns', 'Turn pile more frequently', 'Add coarse materials for air flow']
  },
  {
    problem: 'Pile not heating up',
    causes: ['Too much carbon (browns)', 'Too dry', 'Pile too small'],
    solutions: ['Add more greens', 'Water lightly while turning', 'Build larger pile (3x3x3 feet minimum)']
  },
  {
    problem: 'Pile attracting pests',
    causes: ['Wrong materials', 'Exposed food scraps', 'Too wet'],
    solutions: ['Avoid meat/dairy', 'Bury scraps in center', 'Improve drainage']
  },
  {
    problem: 'Very slow decomposition',
    causes: ['Poor ratios', 'Lack of turning', 'Too dry'],
    solutions: ['Adjust brown/green ratio', 'Turn more frequently', 'Monitor moisture levels']
  }
]

const seasonalTips = [
  {
    season: 'Spring',
    icon: Leaf,
    tips: [
      'Perfect time to start new compost piles with abundant green materials',
      'Turn over winter piles and check for finished compost',
      'Screen and use mature compost in garden beds',
      'Start collecting brown materials for summer balance'
    ]
  },
  {
    season: 'Summer',
    icon: Thermometer,
    tips: [
      'Monitor moisture levels closely in hot weather',
      'Add water while turning if pile becomes too dry',
      'Take advantage of fast decomposition rates',
      'Collect grass clippings for nitrogen boost'
    ]
  },
  {
    season: 'Autumn',
    tips: [
      'Collect fallen leaves for excellent brown material',
      'Layer leaves with kitchen scraps for winter composting',
      'Insulate active piles for continued winter decomposition',
      'Harvest finished compost for winter soil improvement'
    ]
  },
  {
    season: 'Winter',
    tips: [
      'Continue adding kitchen scraps to insulated piles',
      'Turn piles less frequently to conserve heat',
      'Plan next year\'s composting setup and materials',
      'Study and prepare for spring composting activities'
    ]
  }
]

export default function CompostingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Recycle className="w-12 h-12 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Complete Composting Guide</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Transform your garden waste and kitchen scraps into black gold! Learn everything about composting 
            from basic techniques to troubleshooting common problems.
          </p>
        </div>

        {/* Benefits Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Why Compost is Garden Gold
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Leaf className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Soil Health</h3>
              <p className="text-gray-600 text-sm">Improves soil structure, drainage, and nutrient retention.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Recycle className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Waste Reduction</h3>
              <p className="text-gray-600 text-sm">Diverts 30% of household waste from landfills.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Droplets className="w-8 h-8 text-cyan-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Water Retention</h3>
              <p className="text-gray-600 text-sm">Helps soil hold moisture, reducing watering needs.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <CheckCircle className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Cost Savings</h3>
              <p className="text-gray-600 text-sm">Free fertilizer and soil amendment for your garden.</p>
            </div>
          </div>
        </section>

        {/* Composting Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Choose Your Composting Method
          </h2>
          <div className="grid lg:grid-cols-3 gap-8">
            {compostingMethods.map((method) => (
              <div key={method.method} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <method.icon className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{method.method}</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-blue-600 font-medium">{method.timeframe}</span>
                      <span className="text-amber-600 font-medium">{method.difficulty}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{method.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-green-700 mb-2">Materials Needed:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {method.materials.map((material) => (
                      <li key={material} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {material}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">Steps:</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    {method.steps.map((step, index) => (
                      <li key={step} className="flex items-start">
                        <span className="text-blue-500 mr-2 font-medium">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-green-700 mb-1">Pros:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {method.pros.map((pro) => (
                        <li key={pro} className="flex items-start">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-red-700 mb-1">Cons:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {method.cons.map((con) => (
                        <li key={con} className="flex items-start">
                          <AlertTriangle className="w-3 h-3 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What to Compost */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            What Goes in Your Compost?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Greens */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <h3 className="text-xl font-bold text-gray-800">Greens (Nitrogen)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Fresh, moist materials that provide nitrogen for microbial activity.</p>
              <div className="space-y-3">
                {compostIngredients.greens.map((item) => (
                  <div key={item.item} className="border-l-4 border-green-400 pl-3">
                    <h4 className="text-sm font-semibold text-gray-800">{item.item}</h4>
                    <p className="text-xs text-gray-600">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Browns */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-4 h-4 bg-amber-600 rounded-full mr-3"></div>
                <h3 className="text-xl font-bold text-gray-800">Browns (Carbon)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Dry materials that provide carbon and help create air pockets.</p>
              <div className="space-y-3">
                {compostIngredients.browns.map((item) => (
                  <div key={item.item} className="border-l-4 border-amber-400 pl-3">
                    <h4 className="text-sm font-semibold text-gray-800">{item.item}</h4>
                    <p className="text-xs text-gray-600">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <h3 className="text-xl font-bold text-gray-800">Never Compost</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Materials that can cause problems or health risks.</p>
              <div className="space-y-3">
                {compostIngredients.avoid.map((item) => (
                  <div key={item.item} className="border-l-4 border-red-400 pl-3">
                    <h4 className="text-sm font-semibold text-gray-800">{item.item}</h4>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Troubleshooting Common Problems
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {troubleshootingGuide.map((issue) => (
              <div key={issue.problem} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mr-2" />
                  <h3 className="text-lg font-bold text-gray-800">{issue.problem}</h3>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Possible Causes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {issue.causes.map((cause) => (
                      <li key={cause} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2">Solutions:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {issue.solutions.map((solution) => (
                      <li key={solution} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seasonal Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Seasonal Composting Calendar
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasonalTips.map((season) => (
              <div key={season.season} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  {season.icon && <season.icon className="w-6 h-6 text-green-600 mr-2" />}
                  <h3 className="text-xl font-bold text-gray-800">{season.season}</h3>
                </div>
                <ul className="space-y-2">
                  {season.tips.map((tip) => (
                    <li key={tip} className="flex items-start">
                      <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* AI Advisor CTA */}
        <section className="bg-gradient-to-r from-green-600 to-amber-600 rounded-lg p-8 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Recycle className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-bold">Need Composting Help?</h2>
            </div>
            <p className="text-lg mb-6 text-green-100">
              Get personalized composting advice from our AI garden expert, Aitor. Whether you&apos;re troubleshooting 
              problems or planning your compost system, Aitor can help!
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Info className="w-5 h-5 text-green-200 mr-2" />
                <span className="text-green-200 font-medium">Ask Aitor about:</span>
              </div>
              <ul className="text-sm text-green-100 space-y-1">
                <li>• Troubleshooting specific composting problems</li>
                <li>• Composting systems for your space and needs</li>
                <li>• Seasonal composting strategies and timing</li>
                <li>• Using finished compost in your garden effectively</li>
              </ul>
            </div>
            <Link 
              href="/ai-advisor" 
              className="inline-flex items-center bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Ask Aitor About Composting
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        {/* Quick Reference */}
        <section className="mt-12">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded">
            <div className="flex items-center mb-3">
              <Info className="w-6 h-6 text-amber-600 mr-2" />
              <h3 className="text-lg font-semibold text-amber-800">Golden Rules of Composting</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">The Perfect Recipe:</h4>
                <p className="text-amber-700">3 parts brown materials to 1 part green materials for optimal decomposition.</p>
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Moisture Check:</h4>
                <p className="text-amber-700">Pile should feel like a wrung-out sponge - moist but not dripping.</p>
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Size Matters:</h4>
                <p className="text-amber-700">Minimum 3x3x3 feet for hot composting, smaller OK for cold composting.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
