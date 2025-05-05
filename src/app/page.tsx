import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  CheckCircle2,
  ListTodo,
  BarChart3,
  Calendar,
  Clock,
  Repeat,
  Target,
  Filter,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our hybrid task & habit management system combines everything you
              need to stay productive and build lasting habits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ListTodo className="w-6 h-6" />,
                title: "Unified Dashboard",
                description:
                  "View both tasks and habits in a single, organized interface",
              },
              {
                icon: <Repeat className="w-6 h-6" />,
                title: "5 Habit Types",
                description:
                  "Simple check-off, quantity-based, time-based, yes/no, and counter habits",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Progress Visualization",
                description:
                  "Statistical charts showing completion rates and comparisons",
              },
              {
                icon: <Filter className="w-6 h-6" />,
                title: "Advanced Filtering",
                description:
                  "Filter by type, date, priority, and tags to manage up to 100 items",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Cloud Synchronization",
                description:
                  "Automatic data syncing with 24-month history retention",
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "Goal Setting",
                description:
                  "Set and track goals tied to your habits and tasks",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our simple workflow helps you manage tasks and build habits
              effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ListTodo className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create & Organize</h3>
              <p className="text-gray-600">
                Add tasks and habits with custom details, due dates, and
                reminders
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your daily, weekly, and monthly completion rates
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyze & Improve</h3>
              <p className="text-gray-600">
                Review your statistics and adjust your habits for better results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5</div>
              <div className="text-blue-100">Habit Types</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24</div>
              <div className="text-blue-100">Months of History</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-blue-100">Items Capacity</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Start managing your tasks and building better habits today with our
            all-in-one platform.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
