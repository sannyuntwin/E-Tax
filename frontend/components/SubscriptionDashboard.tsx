'use client'

import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, Users, FileText, Zap, Crown } from 'lucide-react'

interface CompanySubscription {
  id: number
  company_id: number
  subscription_plan_id: number
  status: string
  trial_ends_at?: string
  current_period_start: string
  current_period_end: string
  next_billing_date: string
  cancelled_at?: string
  cancel_reason?: string
  auto_renew: boolean
  usage_stats: any
  subscription_plan: SubscriptionPlan
}

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

interface UsageQuota {
  id: number
  company_id: number
  resource_type: string
  limit_value: number
  used_value: number
  reset_period: string
  last_reset: string
  is_over_limit: boolean
}

interface SubscriptionDashboardProps {
  onUpgradePlan: () => void
  onManageBilling: () => void
  onWhiteLabel: () => void
}

export default function SubscriptionDashboard({ onUpgradePlan, onManageBilling, onWhiteLabel }: SubscriptionDashboardProps) {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null)
  const [quotas, setQuotas] = useState<UsageQuota[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const [subscriptionRes, quotasRes] = await Promise.all([
        fetch(`${API_BASE}/api/subscription`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
        fetch(`${API_BASE}/api/usage-quotas`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
      ])

      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json()
        setSubscription(subscriptionData)
      }

      if (quotasRes.ok) {
        const quotasData = await quotasRes.json()
        setQuotas(quotasData)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trial': return <Clock className="w-4 h-4" />
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      case 'expired': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Found</h3>
        <p className="text-gray-600 mb-4">Choose a plan to get started</p>
        <button
          onClick={onUpgradePlan}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Choose Plan
        </button>
      </div>
    )
  }

  const plan = subscription.subscription_plan
  const isTrial = subscription.status === 'trial'
  const daysUntilTrialEnd = isTrial && subscription.trial_ends_at ? getDaysUntil(subscription.trial_ends_at) : 0
  const daysUntilBilling = getDaysUntil(subscription.next_billing_date)

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Subscription Status
          </h3>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
            {getStatusIcon(subscription.status)}
            <span className="ml-2 capitalize">{subscription.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {plan.name}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {plan.description}
            </p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(plan.price, plan.currency)}
              <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                /{plan.billing_cycle}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Next Billing Date:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(subscription.next_billing_date)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Auto-renew:</span>
              <span className={`font-medium ${subscription.auto_renew ? 'text-green-600' : 'text-red-600'}`}>
                {subscription.auto_renew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {isTrial && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Trial Ends:</span>
                <span className={`font-medium ${daysUntilTrialEnd <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                  {daysUntilTrialEnd} days
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Trial Alert */}
        {isTrial && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Trial Period Active
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your trial ends in {daysUntilTrialEnd} days. Upgrade to continue using the service.
                </p>
              </div>
            </div>
            <button
              onClick={onUpgradePlan}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* Cancelled Alert */}
        {subscription.status === 'cancelled' && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Subscription Cancelled
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Your subscription will expire on {formatDate(subscription.current_period_end)}.
                </p>
              </div>
            </div>
            <button
              onClick={onUpgradePlan}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Reactivate
            </button>
          </div>
        )}
      </div>

      {/* Usage Quotas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Usage Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quotas.map((quota) => {
            const percentage = getUsagePercentage(quota.used_value, quota.limit_value)
            const color = getUsageColor(percentage)
            const isOverLimit = quota.is_over_limit

            const getIcon = (resourceType: string) => {
              switch (resourceType) {
                case 'invoices': return <FileText className="w-5 h-5" />
                case 'api_calls': return <Zap className="w-5 h-5" />
                case 'users': return <Users className="w-5 h-5" />
                case 'storage': return <Crown className="w-5 h-5" />
                default: return <TrendingUp className="w-5 h-5" />
              }
            }

            const getLabel = (resourceType: string) => {
              switch (resourceType) {
                case 'invoices': return 'Invoices'
                case 'api_calls': return 'API Calls'
                case 'users': return 'Users'
                case 'storage': return 'Storage'
                default: return resourceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
              }
            }

            return (
              <div key={quota.id} className="text-center">
                <div className="flex justify-center mb-2 text-gray-600 dark:text-gray-400">
                  {getIcon(quota.resource_type)}
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {getLabel(quota.resource_type)}
                </h4>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {quota.used_value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    of {quota.limit_value === 999999 ? 'Unlimited' : quota.limit_value}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${color}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                {isOverLimit && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Over limit
                  </p>
                )}
                {percentage >= 75 && !isOverLimit && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {percentage >= 90 ? 'Almost at limit' : 'Getting close to limit'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onUpgradePlan}
            className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Crown className="w-5 h-5 text-primary-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                Upgrade Plan
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Change your subscription
              </div>
            </div>
          </button>

          <button
            onClick={onManageBilling}
            className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <CreditCard className="w-5 h-5 text-primary-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                Manage Billing
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Payment methods & invoices
              </div>
            </div>
          </button>

          <button
            onClick={onWhiteLabel}
            className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Crown className="w-5 h-5 text-primary-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                White-Label
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Customize your brand
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Your Plan Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
