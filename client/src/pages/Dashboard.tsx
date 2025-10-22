import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  Coins, 
  Target, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Bitcoin,
  Zap,
  Shield,
  Award,
  Heart,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { Link } from "wouter";

// Enhanced Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  subtitle,
  onClick 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: { value: number; isPositive: boolean; label?: string };
  color?: "blue" | "green" | "orange" | "purple" | "red";
  subtitle?: string;
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-500",
    green: "from-emerald-500 to-green-500", 
    orange: "from-orange-500 to-amber-500",
    purple: "from-purple-500 to-violet-500",
    red: "from-red-500 to-rose-500"
  };

  const CardComponent = onClick ? Button : Card;
  const cardProps = onClick ? { 
    variant: "ghost" as const, 
    className: "w-full h-full p-0 hover:bg-orange-50/50 transition-all duration-200" 
  } : {};

  return (
    <CardComponent {...cardProps} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <p className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </p>
                {trend.label && (
                  <p className="text-xs text-gray-500 ml-1">{trend.label}</p>
                )}
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </CardContent>
    </CardComponent>
  );
};

// Quick Action Card Component
const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = "orange",
  badge 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color?: "blue" | "green" | "orange" | "purple";
  badge?: string;
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-500",
    green: "from-emerald-500 to-green-500", 
    orange: "from-orange-500 to-amber-500",
    purple: "from-purple-500 to-violet-500"
  };

  return (
    <Link href={href}>
      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50/30 hover:from-orange-50/50 hover:to-amber-50/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg group-hover:shadow-xl transition-all duration-200`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            {badge && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {badge}
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-200">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

// Recent Activity Component
const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: "payment",
      title: "Payment received",
      description: "Aissatou Diop paid 50,000 sats",
      time: "2 hours ago",
      icon: Coins,
      color: "green"
    },
    {
      id: 2,
      type: "cycle",
      title: "Cycle completed",
      description: "Marché Liberté Women's Circle cycle 1",
      time: "1 day ago",
      icon: Target,
      color: "blue"
    },
    {
      id: 3,
      type: "member",
      title: "New member joined",
      description: "Fatou Cissé joined Garage & Vendors Co-op",
      time: "2 days ago",
      icon: Users,
      color: "purple"
    },
    {
      id: 4,
      type: "payout",
      title: "Payout processed",
      description: "150,000 sats sent to winner",
      time: "3 days ago",
      icon: Zap,
      color: "orange"
    }
  ];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest updates from your tontine groups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            const colorClasses = {
              green: "bg-emerald-100 text-emerald-600",
              blue: "bg-blue-100 text-blue-600",
              purple: "bg-purple-100 text-purple-600",
              orange: "bg-orange-100 text-orange-600"
            };

            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className={`p-2 rounded-lg ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button variant="outline" size="sm" className="w-full">
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Chart Component (Placeholder)
const PerformanceChart = () => {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          Performance Overview
        </CardTitle>
        <CardDescription>
          Your tontine groups performance this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Group Completion Rate</span>
            <span className="text-sm font-bold text-emerald-600">92%</span>
          </div>
          <Progress value={92} className="h-3" />
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Payment Success Rate</span>
            <span className="text-sm font-bold text-blue-600">98%</span>
          </div>
          <Progress value={98} className="h-3" />
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Member Satisfaction</span>
            <span className="text-sm font-bold text-purple-600">95%</span>
          </div>
          <Progress value={95} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const stats = [
    {
      title: "Total Groups",
      value: 3,
      icon: Users,
      trend: { value: 12, isPositive: true, label: "vs last month" },
      color: "blue" as const,
      subtitle: "Active tontine groups"
    },
    {
      title: "Total Members",
      value: 7,
      icon: Heart,
      trend: { value: 8, isPositive: true, label: "vs last month" },
      color: "green" as const,
      subtitle: "Across all groups"
    },
    {
      title: "Total Contributions",
      value: "425k sats",
      icon: Coins,
      trend: { value: 15, isPositive: true, label: "vs last month" },
      color: "orange" as const,
      subtitle: "This month"
    },
    {
      title: "Active Cycles",
      value: 3,
      icon: Target,
      trend: { value: 5, isPositive: true, label: "vs last month" },
      color: "purple" as const,
      subtitle: "Currently running"
    }
  ];

  const quickActions = [
    {
      title: "Create New Group",
      description: "Start a new tontine group and invite members",
      icon: Users,
      href: "/groups/create",
      color: "orange" as const,
      badge: "Popular"
    },
    {
      title: "Make Payment",
      description: "Pay your contribution for active cycles",
      icon: Zap,
      href: "/payments",
      color: "green" as const
    },
    {
      title: "View Analytics",
      description: "Detailed insights and performance metrics",
      icon: BarChart3,
      href: "/analytics",
      color: "blue" as const
    },
    {
      title: "Manage Profile",
      description: "Update your profile and preferences",
      icon: Shield,
      href: "/profile",
      color: "purple" as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
              <Bitcoin className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/groups">
              <Button variant="ghost" className="hover:bg-orange-100">
                <Users className="mr-2 h-4 w-4" />
                Groups
              </Button>
            </Link>
            <Button variant="ghost" className="hover:bg-orange-100">
              <Award className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-lg text-gray-600">Here's what's happening with your tontine groups</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              color={stat.color}
              subtitle={stat.subtitle}
              onClick={() => {
                // Handle click for navigation
                console.log(`Navigate to ${stat.title}`);
              }}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  href={action.href}
                  color={action.color}
                  badge={action.badge}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <RecentActivity />
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid lg:grid-cols-2 gap-8">
          <PerformanceChart />
          
          {/* Upcoming Events */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Upcoming Events
              </CardTitle>
              <CardDescription>
                Important dates and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">Payment Due</h4>
                    <p className="text-sm text-gray-600">Marché Liberté Women's Circle</p>
                    <p className="text-xs text-orange-600 font-medium">Due in 2 days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">Cycle Completion</h4>
                    <p className="text-sm text-gray-600">Garage & Vendors Co-op</p>
                    <p className="text-xs text-blue-600 font-medium">Expected in 5 days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">New Member Invite</h4>
                    <p className="text-sm text-gray-600">Dakar University Students</p>
                    <p className="text-xs text-purple-600 font-medium">Pending approval</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
