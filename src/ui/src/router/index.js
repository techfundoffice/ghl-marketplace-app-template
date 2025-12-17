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
    children: [
      {
        path: '',
        redirect: '/settings/business-profile'
      },
      {
        path: 'business-profile',
        component: BusinessProfile
      },
      {
        path: 'my-profile',
        component: () => import('../components/settings/MyProfile.vue')
      },
      {
        path: 'billing',
        component: () => import('../components/settings/Billing.vue')
      },
      {
        path: 'my-staff',
        component: () => import('../components/settings/MyStaff.vue')
      },
      {
        path: 'opportunities-pipelines',
        component: () => import('../components/settings/OpportunitiesPipelines.vue')
      },
      {
        path: 'automation',
        component: () => import('../components/settings/Automation.vue')
      },
      {
        path: 'calendars',
        component: () => import('../components/settings/Calendars.vue')
      },
      {
        path: 'conversation-ai',
        component: () => import('../components/settings/ConversationAI.vue')
      },
      {
        path: 'knowledge-base',
        component: () => import('../components/settings/KnowledgeBase.vue')
      },
      {
        path: 'voice-ai-agents',
        component: () => import('../components/settings/VoiceAIAgents.vue')
      },
      {
        path: 'email-services',
        component: () => import('../components/settings/EmailServices.vue')
      },
      {
        path: 'phone-numbers',
        component: () => import('../components/settings/PhoneNumbers.vue')
      },
      {
        path: 'whatsapp',
        component: () => import('../components/settings/WhatsApp.vue')
      },
      {
        path: 'objects',
        component: () => import('../components/settings/Objects.vue')
      },
      {
        path: 'custom-fields',
        component: () => import('../components/settings/CustomFields.vue')
      },
      {
        path: 'custom-values',
        component: () => import('../components/settings/CustomValues.vue')
      },
      {
        path: 'manage-scoring',
        component: () => import('../components/settings/ManageScoring.vue')
      },
      {
        path: 'domains-url-redirects',
        component: () => import('../components/settings/DomainsURLRedirects.vue')
      },
      {
        path: 'integrations',
        component: () => import('../components/settings/Integrations.vue')
      },
      {
        path: 'private-integrations',
        component: () => import('../components/settings/PrivateIntegrations.vue')
      },
      {
        path: 'conversation-providers',
        component: () => import('../components/settings/ConversationProviders.vue')
      },
      {
        path: 'tags',
        component: () => import('../components/settings/Tags.vue')
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
        path: 'brand-boards',
        component: () => import('../components/settings/BrandBoards.vue')
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
