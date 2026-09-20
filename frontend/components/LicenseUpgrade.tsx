'use client'

import { useState, useEffect } from 'react'
import { Crown, Zap, Users, FileText, Check, Star, ArrowRight } from 'lucide-react'

interface LicensePlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billing_cycle: string
  features: string[]
  max_users: number
  max_invoices: number
  max_api_keys: number
  popular?: boolean
}

interface LicenseUpgradeProps {
  currentLicenseType?: string
  onUpgrade: (plan: LicensePlan) => void
}

export default function LicenseUpgrade({ currentLicenseType = 'trial', onUpgrade }: LicenseUpgradeProps) {
  const [plans, setPlans] = useState<LicensePlan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081'

  useEffect(() => {
    fetchPlans()
  }, [billingCycle])

  const fetchPlans = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockPlans: LicensePlan[] = [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Perfect for small businesses',
          price: billingCycle === 'monthly' ? 29 : 290,
          currency: 'USD',
          billing_cycle: billingCycle,
          features: [
            'Basic Invoicing',
            'Multi-User (5 users)',
            'Email Support',
            'Basic Reports'
          ],
          max_users: 5,
          max_invoices: 100,
          max_api_keys: 1
        },
        {
          id: 'professional',
          name: 'Professional',
          description: 'Ideal for growing businesses',
          price: billingCycle === 'monthly' ? 79 : 790,
          currency: 'USD',
          billing_cycle: billingCycle,
          features: [
            'Advanced Invoicing',
            'Multi-User (10 users)',
            'Recurring Invoices',
            'API Access',
            'Priority Support',
            'Advanced Reports'
          ],
          max_users: 10,
          max_invoices: 1000,
          max_api_keys: 5,
          popular: true
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'For large organizations',
          price: billingCycle === 'monthly' ? 199 : 1990,
          currency: 'USD',
          billing_cycle: billingCycle,
          features: [
            'Unlimited Everything',
            'Unlimited Users',
            'White-Label Options',
            'Advanced API Access',
            'Dedicated Support',
            'Custom Integrations',
            'POS Integration',
            'Marketplace Sync'
          ],
          max_users: -1,
          max_invoices: -1,
          max_api_keys: -1
        }
      ]
      setPlans(mockPlans)
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'enterprise':
        return <Crown className="w-8 h-8 text-purple-500" />
      case 'professional':
        return <Zap className="w-8 h-8 text-blue-500" />
      case 'basic':
        return <Users className="w-8 h-8 text-green-500" />
      default:
        return <FileText className="w-8 h-8 text-gray-500" />
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'enterprise':
        return 'border-purple-200 bg-purple-50'
      case 'professional':
        return 'border-blue-200 bg-blue-50'
      case 'basic':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const isCurrentPlan = (planId: string) => {
    return planId === currentLicenseType
  }

  const isUpgrade = (planId: string) => {
    const planOrder = ['trial', 'basic', 'professional', 'enterprise']
    const currentIndex = planOrder.indexOf(currentLicenseType)
    const planIndex = planOrder.indexOf(planId)
    return planIndex > currentIndex
  }

  const handleUpgrade = (plan: LicensePlan) => {
    setSelectedPlan(plan.id)
    onUpgrade(plan)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upgrade Your License</h2>
        <p className="text-gray-600 mb-6">
          Choose the perfect plan for your business needs
        </p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-green-600 text-xs">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id)
          const isUpgrading = isUpgrade(plan.id)
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 p-6 transition-all hover:shadow-lg ${
                plan.popular ? 'border-blue-500 shadow-lg' : getPlanColor(plan.id)
              } ${isCurrent ? 'opacity-75' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limits */}
              <div className="border-t pt-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Users:</span>
                  <span className="font-medium">
                    {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Invoices:</span>
                  <span className="font-medium">
                    {plan.max_invoices === -1 ? 'Unlimited' : plan.max_invoices}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">API Keys:</span>
                  <span className="font-medium">
                    {plan.max_api_keys === -1 ? 'Unlimited' : plan.max_api_keys}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || selectedPlan === plan.id}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : selectedPlan === plan.id
                    ? 'bg-green-600 text-white'
                    : isUpgrading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isCurrent ? (
                  'Current Plan'
                ) : selectedPlan === plan.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Selected
                  </>
                ) : isUpgrading ? (
                  <>
                    Upgrade
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Downgrade'
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Feature</th>
                <th className="text-center py-2">Basic</th>
                <th className="text-center py-2">Professional</th>
                <th className="text-center py-2">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Basic Invoicing</td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Advanced Templates</td>
                <td className="text-center">-</td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Recurring Invoices</td>
                <td className="text-center">-</td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2">API Access</td>
                <td className="text-center">-</td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2">White-Label</td>
                <td className="text-center">-</td>
                <td className="text-center">-</td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2">Priority Support</td>
                <td className="text-center">-</td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
