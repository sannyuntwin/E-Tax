'use client'

import { useState, useEffect } from 'react'
import { Check, Star, Zap, Crown, Rocket } from 'lucide-react'

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: number
  currency: string
  billing_cycle: string
  features: string[]
  max_invoices: number
  max_users: number
  max_api_keys: number
  is_active: boolean
  sort_order: number
}

interface SubscriptionPlansProps {
  onSelectPlan: (plan: SubscriptionPlan) => void
  currentPlan?: SubscriptionPlan
}

export default function SubscriptionPlans({ onSelectPlan, currentPlan }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchSubscriptionPlans()
  }, [billingCycle])

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/subscription-plans`)
      if (response.ok) {
        const data = await response.json()
        // Filter by billing cycle
        const filteredPlans = data.filter((plan: SubscriptionPlan) => plan.billing_cycle === billingCycle)
        setPlans(filteredPlans)
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('free')) return <Rocket className="w-6 h-6" />
    if (planName.toLowerCase().includes('starter')) return <Zap className="w-6 h-6" />
    if (planName.toLowerCase().includes('professional')) return <Star className="w-6 h-6" />
    if (planName.toLowerCase().includes('enterprise')) return <Crown className="w-6 h-6" />
    return <Rocket className="w-6 h-6" />
  }

  const getPlanColor = (planName: string) => {
    if (planName.toLowerCase().includes('free')) return 'border-gray-300 bg-white'
    if (planName.toLowerCase().includes('starter')) return 'border-blue-500 bg-blue-50'
    if (planName.toLowerCase().includes('professional')) return 'border-purple-500 bg-purple-50'
    if (planName.toLowerCase().includes('enterprise')) return 'border-yellow-500 bg-yellow-50'
    return 'border-gray-300 bg-white'
  }

  const getButtonColor = (planName: string) => {
    if (planName.toLowerCase().includes('free')) return 'bg-gray-600 hover:bg-gray-700'
    if (planName.toLowerCase().includes('starter')) return 'bg-blue-600 hover:bg-blue-700'
    if (planName.toLowerCase().includes('professional')) return 'bg-purple-600 hover:bg-purple-700'
    if (planName.toLowerCase().includes('enterprise')) return 'bg-yellow-600 hover:bg-yellow-700'
    return 'bg-gray-600 hover:bg-gray-700'
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getYearlyDiscount = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 12
    const discount = Math.round((1 - (yearlyPrice * 0.9) / yearlyPrice) * 100)
    return discount
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free and scale as you grow. No hidden fees.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 10%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id
            const planColor = getPlanColor(plan.name)
            const buttonColor = getButtonColor(plan.name)
            const icon = getPlanIcon(plan.name)

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all hover:shadow-xl ${planColor} ${
                  isCurrentPlan ? 'ring-4 ring-primary-200' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.sort_order === 3 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4 text-primary-600">
                    {icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency)}
                    <span className="text-lg font-normal text-gray-600">
                      /{plan.billing_cycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && plan.price > 0 && (
                    <div className="text-sm text-green-600 mt-2">
                      Save {getYearlyDiscount(plan.price / 12)}% vs monthly
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Invoices</span>
                    <span className="font-medium text-gray-900">
                      {plan.max_invoices === 999999 ? 'Unlimited' : plan.max_invoices}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Users</span>
                    <span className="font-medium text-gray-900">
                      {plan.max_users === 999 ? 'Unlimited' : plan.max_users}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">API Keys</span>
                    <span className="font-medium text-gray-900">
                      {plan.max_api_keys === 100 ? '100' : plan.max_api_keys}
                    </span>
                  </div>
                </div>

                {/* Plan Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onSelectPlan(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : `${buttonColor} text-white`
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              All plans include:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Secure & Reliable</h4>
                  <p className="text-sm text-gray-600">Bank-level security with 99.9% uptime</p>
                </div>
              </div>
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">24/7 Support</h4>
                  <p className="text-sm text-gray-600">Email and chat support for all plans</p>
                </div>
              </div>
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Free Updates</h4>
                  <p className="text-sm text-gray-600">All features and updates included</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="font-medium text-gray-900 mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-sm text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="font-medium text-gray-900 mb-2">
                What happens if I exceed my limits?
              </h4>
              <p className="text-sm text-gray-600">
                We'll notify you when you're approaching your limits. You can upgrade anytime to continue using the service.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="font-medium text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-sm text-gray-600">
                Yes! All paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="font-medium text-gray-900 mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-sm text-gray-600">
                Absolutely. You can cancel your subscription anytime with no cancellation fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
