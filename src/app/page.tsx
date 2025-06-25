import { Calendar, Bell, Sprout, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Community Allotment Association
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your digital hub for allotment community management, announcements, and AI-powered gardening advice
        </p>
        <div className="bg-primary-100 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-primary-800 mb-4">🌱 Growing Together</h2>
          <p className="text-primary-700">
            Stay connected with your allotment community, receive important announcements, 
            and get personalized plant care advice powered by AI.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Bell className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Announcements</h3>
          <p className="text-gray-600">
            Stay informed about deliveries, orders, community events, and important updates.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Calendar className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Calendar</h3>
          <p className="text-gray-600">
            Track important dates, seasonal tasks, and community events in one place.
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
          <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Community</h3>
          <p className="text-gray-600">
            Connect with fellow gardeners, share experiences, and build a thriving community.
          </p>
        </div>
      </section>

      {/* Recent Announcements Preview */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Announcements</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-primary-500 pl-4">
            <h3 className="font-semibold text-lg">🚚 Bark Delivery This Weekend</h3>
            <p className="text-gray-600">Fresh bark mulch delivery scheduled for Saturday morning. Remember to bring your wheelbarrow!</p>
            <span className="text-sm text-gray-500">2 days ago</span>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-lg">📝 Seed Order Deadline</h3>
            <p className="text-gray-600">Don&apos;t forget to submit your seed orders by Friday. Spring catalog available in the community center.</p>
            <span className="text-sm text-gray-500">1 week ago</span>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg">🌿 Monthly Gardening Tips</h3>
            <p className="text-gray-600">June tasks: Time to plant summer vegetables, harvest early crops, and prepare for the growing season ahead.</p>
            <span className="text-sm text-gray-500">2 weeks ago</span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <a href="/announcements" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
            View All Announcements
          </a>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-primary-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Get Plant Advice</h3>
          <p className="text-gray-600 mb-4">Ask our AI advisor about plant care, pest control, or seasonal tasks.</p>
          <a href="/ai-advisor" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition">
            Ask AI Advisor
          </a>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Check Calendar</h3>
          <p className="text-gray-600 mb-4">View upcoming events, deadlines, and seasonal reminders.</p>
          <a href="/calendar" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            View Calendar
          </a>
        </div>

        <div className="bg-amber-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Composting Guide</h3>
          <p className="text-gray-600 mb-4">Learn how to turn garden waste into black gold for your plants.</p>
          <a href="/composting" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition">
            Start Composting
          </a>
        </div>

        <div className="bg-green-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">Companion Planting</h3>
          <p className="text-gray-600 mb-4">Discover which plants grow better together for a thriving garden.</p>
          <a href="/companion-planting" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
            Learn More
          </a>
        </div>
      </section>
    </div>
  )
}
