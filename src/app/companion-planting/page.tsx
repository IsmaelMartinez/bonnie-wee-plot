'use client'

import Link from 'next/link'
import { Leaf, Users, Shield, Bug, Sprout, Calendar, ArrowRight, Star, Info } from 'lucide-react'

const companionPlantingPairs = [
  {
    plant: 'Tomatoes',
    companions: ['Basil', 'Marigolds', 'Carrots', 'Peppers'],
    benefits: 'Basil improves flavor and repels pests. Marigolds deter nematodes.',
    avoid: ['Fennel', 'Brassicas', 'Corn']
  },
  {
    plant: 'Carrots',
    companions: ['Onions', 'Leeks', 'Rosemary', 'Sage'],
    benefits: 'Onions repel carrot fly. Strong herbs mask carrot scent.',
    avoid: ['Dill', 'Parsnips']
  },
  {
    plant: 'Lettuce',
    companions: ['Chives', 'Garlic', 'Carrots', 'Radishes'],
    benefits: 'Alliums repel aphids. Root vegetables break up soil.',
    avoid: ['None commonly known']
  },
  {
    plant: 'Beans',
    companions: ['Corn', 'Squash', 'Marigolds', 'Nasturtiums'],
    benefits: 'Three Sisters method. Beans fix nitrogen for corn and squash.',
    avoid: ['Onions', 'Garlic', 'Fennel']
  },
  {
    plant: 'Brassicas',
    companions: ['Dill', 'Chamomile', 'Onions', 'Potatoes'],
    benefits: 'Dill attracts beneficial insects. Potatoes repel cabbage worms.',
    avoid: ['Strawberries', 'Tomatoes']
  },
  {
    plant: 'Peppers',
    companions: ['Tomatoes', 'Basil', 'Onions', 'Carrots'],
    benefits: 'Similar growing conditions. Basil enhances flavor.',
    avoid: ['Fennel', 'Beans']
  }
]

const companionPlantingPrinciples = [
  {
    icon: Bug,
    title: 'Pest Control',
    description: 'Some plants naturally repel pests that attack their companions.',
    examples: 'Marigolds deter nematodes, nasturtiums repel aphids'
  },
  {
    icon: Sprout,
    title: 'Nutrient Sharing',
    description: 'Different plants have varying nutrient needs and can complement each other.',
    examples: 'Beans fix nitrogen that benefits heavy feeders like corn'
  },
  {
    icon: Shield,
    title: 'Physical Support',
    description: 'Some plants provide structural support or beneficial shade.',
    examples: 'Corn stalks support climbing beans, tall plants shade lettuce'
  },
  {
    icon: Leaf,
    title: 'Beneficial Attraction',
    description: 'Certain plants attract pollinators and beneficial insects.',
    examples: 'Dill and fennel flowers attract predatory wasps'
  }
]

const seasonalTips = [
  {
    season: 'Spring',
    tips: [
      'Plant lettuce with radishes for early harvest succession',
      'Start tomato and basil seedlings together',
      'Sow carrots with onion sets for pest protection'
    ]
  },
  {
    season: 'Summer',
    tips: [
      'Use taller plants to provide shade for cool-season crops',
      'Plant nasturtiums around cucumber and squash',
      'Interplant fast-growing radishes with slower brassicas'
    ]
  },
  {
    season: 'Autumn',
    tips: [
      'Plant garlic near rose bushes for overwintering pest control',
      'Use cover crops like clover to fix nitrogen for next season',
      'Plant winter herbs near protected areas with vegetables'
    ]
  }
]

export default function CompanionPlantingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Companion Planting Guide</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover which plants grow better together! Companion planting is a time-tested method 
            that helps improve growth, reduce pests, and maximize your allotment space naturally.
          </p>
        </div>

        {/* Principles Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Why Companion Planting Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companionPlantingPrinciples.map((principle) => (
              <div key={principle.title} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                <principle.icon className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{principle.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{principle.description}</p>
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                  <p className="text-xs text-green-700 font-medium">Example:</p>
                  <p className="text-xs text-green-600">{principle.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Companion Pairs Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Popular Companion Planting Combinations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companionPlantingPairs.map((pair) => (
              <div key={pair.plant} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <Leaf className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-800">{pair.plant}</h3>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-green-700 mb-2">Great Companions:</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {pair.companions.map((companion) => (
                      <span key={companion} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {companion}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-700 mb-1">Benefits:</h4>
                  <p className="text-sm text-gray-600">{pair.benefits}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-1">Avoid Planting With:</h4>
                  <p className="text-sm text-gray-600">{pair.avoid}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seasonal Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Seasonal Companion Planting Tips
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {seasonalTips.map((season) => (
              <div key={season.season} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600 mr-2" />
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
        <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Sprout className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-bold">Need Personalized Advice?</h2>
            </div>
            <p className="text-lg mb-6 text-green-100">
              Get customized companion planting recommendations based on your specific plants, 
              growing conditions, and seasonal timing with our AI garden advisor, Aitor.
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Info className="w-5 h-5 text-green-200 mr-2" />
                <span className="text-green-200 font-medium">What Aitor can help with:</span>
              </div>
              <ul className="text-sm text-green-100 space-y-1">
                <li>• Specific plant compatibility for your garden layout</li>
                <li>• Timing recommendations for your location and climate</li>
                <li>• Problem-solving for companion planting challenges</li>
                <li>• Advanced three-sisters and polyculture planning</li>
              </ul>
            </div>
            <Link 
              href="/ai-advisor" 
              className="inline-flex items-center bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Ask Aitor About Companion Planting
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        {/* Quick Reference */}
        <section className="mt-12">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
            <div className="flex items-center mb-3">
              <Info className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-800">Quick Reference</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Universal Companions:</h4>
                <p className="text-yellow-700">Marigolds, nasturtiums, and most herbs work well with almost everything!</p>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Plants to Keep Separate:</h4>
                <p className="text-yellow-700">Fennel, black walnut, and allelopathic plants should be isolated.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
