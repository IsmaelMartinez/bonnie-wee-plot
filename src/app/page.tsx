import { Sprout, Grid3X3, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Community Allotment
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your personal digital hub for garden planning and AI-powered gardening advice
        </p>
        <div className="bg-primary-100 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-primary-800 mb-4">🌱 Growing Together</h2>
          <p className="text-primary-700">
            Plan your perfect garden, get personalized plant care advice powered by AI,
            and learn from our comprehensive growing guides.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Grid3X3 className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Garden Planner</h3>
          <p className="text-gray-600">
            Design your garden beds, plan your crops, and visualize your plot layout.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Sprout className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI Plant Advisor</h3>
          <p className="text-gray-600">
            Get expert gardening advice, plant care tips, and climate-specific recommendations.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <BookOpen className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Growing Guides</h3>
          <p className="text-gray-600">
            Learn about companion planting, composting, and crop rotation techniques.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-primary-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Get Plant Advice</h3>
          <p className="text-gray-600 mb-4">Ask our AI advisor about plant care, pest control, or seasonal tasks.</p>
          <a href="/ai-advisor" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition">
            Ask AI Advisor
          </a>
        </div>

        <div className="bg-lime-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Plan Your Garden</h3>
          <p className="text-gray-600 mb-4">Manage your allotment beds, plan crops, and track planting history.</p>
          <a href="/allotment" className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 transition">
            My Allotment
          </a>
        </div>
      </section>

      {/* Growing Guides */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">📚 Growing Guides</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
            <h3 className="text-xl font-semibold mb-4">🤝 Companion Planting</h3>
            <p className="text-gray-600 mb-4">Discover which plants grow better together for a thriving garden.</p>
            <a href="/companion-planting" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
              Learn More
            </a>
          </div>

          <div className="bg-amber-50 rounded-lg p-6 text-center border border-amber-200">
            <h3 className="text-xl font-semibold mb-4">♻️ Composting</h3>
            <p className="text-gray-600 mb-4">Turn garden waste into black gold for your plants.</p>
            <a href="/composting" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition">
              Start Composting
            </a>
          </div>

          <div className="bg-orange-50 rounded-lg p-6 text-center border border-orange-200">
            <h3 className="text-xl font-semibold mb-4">🔄 Crop Rotation</h3>
            <p className="text-gray-600 mb-4">Maximize soil health and yields with smart rotation planning.</p>
            <a href="/crop-rotation" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition">
              Learn Rotation
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
