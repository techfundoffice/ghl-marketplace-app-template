import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Settings from '../views/Settings.vue';
import BusinessProfile from '../components/settings/BusinessProfile.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/settings',
    component: Settings,
    meta: { hideMainSidebar: true },
    children: [
      {
        path: '',
        redirect: '/settings/my-profile'
      },
      {
        path: 'my-profile',
        component: () => import('../components/settings/MyProfile.vue')
      },
      {
        path: 'company',
        component: () => import('../components/settings/BusinessProfile.vue')
      },
      {
        path: 'team',
        component: () => import('../components/settings/MyStaff.vue')
      },
      {
        path: 'billing',
        component: () => import('../components/settings/Billing.vue')
      },
      {
        path: 'phone-integration',
        component: () => import('../components/settings/PhoneNumbers.vue')
      },
      {
        path: 'email-services',
        component: () => import('../components/settings/EmailServices.vue')
      },
      {
        path: 'system-emails',
        component: () => import('../components/settings/SystemEmails.vue')
      },
      {
        path: 'announcements',
        component: () => import('../components/settings/Announcements.vue')
      },
      {
        path: 'workflow-premium',
        component: () => import('../components/settings/WorkflowPremium.vue')
      },
      {
        path: 'ai-employee',
        component: () => import('../components/settings/AIEmployee.vue')
      },
      {
        path: 'ask-ai-config',
        component: () => import('../components/settings/AskAIConfig.vue')
      },
      {
        path: 'workflow-external-ai',
        component: () => import('../components/settings/WorkflowExternalAI.vue')
      },
      {
        path: 'domain-purchase',
        component: () => import('../components/settings/DomainPurchase.vue')
      },
      {
        path: 'private-integrations',
        component: () => import('../components/settings/PrivateIntegrations.vue')
      },
      {
        path: 'affiliates',
        component: () => import('../components/settings/Affiliates.vue')
      },
      {
        path: 'custom-menu-links',
        component: () => import('../components/settings/CustomMenuLinks.vue')
      },
      {
        path: 'stripe',
        component: () => import('../components/settings/Stripe.vue')
      },
      {
        path: 'compliance',
        component: () => import('../components/settings/Compliance.vue')
      },
      {
        path: 'labs',
        component: () => import('../components/settings/Labs.vue')
      },
      {
        path: 'audit-logs',
        component: () => import('../components/settings/AuditLogs.vue')
      },
      {
        path: 'media-storage-usage',
        component: () => import('../components/settings/MediaStorageUsage.vue')
      },
      {
        path: 'help-ghl-api',
        component: () => import('../components/settings/HelpGHLAPI.vue')
      },
      {
        path: 'business-profile',
        component: BusinessProfile
      }
    ]
  },
  {
    path: '/launchpad',
    name: 'Launchpad',
    component: Dashboard
  },
  {
    path: '/conversations',
    name: 'Conversations',
    component: Dashboard
  },
  {
    path: '/calendars',
    name: 'Calendars',
    component: Dashboard
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: Dashboard
  },
  {
    path: '/opportunities',
    name: 'Opportunities',
    component: Dashboard
  },
  {
    path: '/payments',
    name: 'Payments',
    component: Dashboard
  },
  {
    path: '/ai-agents',
    name: 'AI Agents',
    component: Dashboard
  },
  {
    path: '/marketing',
    name: 'Marketing',
    component: Dashboard
  },
  {
    path: '/automation',
    name: 'Automation',
    component: Dashboard
  },
  {
    path: '/sites',
    name: 'Sites',
    component: Dashboard
  },
  {
    path: '/memberships',
    name: 'Memberships',
    component: Dashboard
  },
  {
    path: '/media-storage',
    name: 'Media Storage',
    component: Dashboard
  },
  {
    path: '/reputation',
    name: 'Reputation',
    component: Dashboard
  },
  {
    path: '/reporting',
    name: 'Reporting',
    component: Dashboard
  },
  {
    path: '/app-marketplace',
    name: 'App Marketplace',
    component: Dashboard
  },
  {
    path: '/ai-site-builder',
    name: 'AI Site Builder',
    component: Dashboard
  },
  {
    path: '/account-booster',
    name: 'Account Booster',
    component: Dashboard
  },
  {
    path: '/yelp-scraper',
    name: 'Yelp Scraper',
    component: () => import('../views/YelpScraper.vue')
  },
  {
    path: '/reviewers',
    name: 'Reviewers Database',
    component: () => import('../views/ReviewersDatabase.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
