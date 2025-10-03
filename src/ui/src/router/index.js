import { createRouter, createWebHistory } from 'vue-router';
import Settings from '../views/Settings.vue';
import BusinessProfile from '../components/settings/BusinessProfile.vue';
import MyProfile from '../components/settings/MyProfile.vue';
import Billing from '../components/settings/Billing.vue';
import MyStaff from '../components/settings/MyStaff.vue';
import OpportunitiesPipelines from '../components/settings/OpportunitiesPipelines.vue';
import Automation from '../components/settings/Automation.vue';
import Calendars from '../components/settings/Calendars.vue';
import ConversationAI from '../components/settings/ConversationAI.vue';
import KnowledgeBase from '../components/settings/KnowledgeBase.vue';
import VoiceAIAgents from '../components/settings/VoiceAIAgents.vue';
import EmailServices from '../components/settings/EmailServices.vue';
import PhoneNumbers from '../components/settings/PhoneNumbers.vue';
import WhatsApp from '../components/settings/WhatsApp.vue';
import Objects from '../components/settings/Objects.vue';
import CustomFields from '../components/settings/CustomFields.vue';
import CustomValues from '../components/settings/CustomValues.vue';
import ManageScoring from '../components/settings/ManageScoring.vue';
import DomainsURLRedirects from '../components/settings/DomainsURLRedirects.vue';
import Integrations from '../components/settings/Integrations.vue';
import PrivateIntegrations from '../components/settings/PrivateIntegrations.vue';
import ConversationProviders from '../components/settings/ConversationProviders.vue';
import Tags from '../components/settings/Tags.vue';
import Labs from '../components/settings/Labs.vue';
import AuditLogs from '../components/settings/AuditLogs.vue';
import BrandBoards from '../components/settings/BrandBoards.vue';

const routes = [
  {
    path: '/',
    redirect: '/settings'
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
        component: MyProfile
      },
      {
        path: 'billing',
        component: Billing
      },
      {
        path: 'my-staff',
        component: MyStaff
      },
      {
        path: 'opportunities-pipelines',
        component: OpportunitiesPipelines
      },
      {
        path: 'automation',
        component: Automation
      },
      {
        path: 'calendars',
        component: Calendars
      },
      {
        path: 'conversation-ai',
        component: ConversationAI
      },
      {
        path: 'knowledge-base',
        component: KnowledgeBase
      },
      {
        path: 'voice-ai-agents',
        component: VoiceAIAgents
      },
      {
        path: 'email-services',
        component: EmailServices
      },
      {
        path: 'phone-numbers',
        component: PhoneNumbers
      },
      {
        path: 'whatsapp',
        component: WhatsApp
      },
      {
        path: 'objects',
        component: Objects
      },
      {
        path: 'custom-fields',
        component: CustomFields
      },
      {
        path: 'custom-values',
        component: CustomValues
      },
      {
        path: 'manage-scoring',
        component: ManageScoring
      },
      {
        path: 'domains-url-redirects',
        component: DomainsURLRedirects
      },
      {
        path: 'integrations',
        component: Integrations
      },
      {
        path: 'private-integrations',
        component: PrivateIntegrations
      },
      {
        path: 'conversation-providers',
        component: ConversationProviders
      },
      {
        path: 'tags',
        component: Tags
      },
      {
        path: 'labs',
        component: Labs
      },
      {
        path: 'audit-logs',
        component: AuditLogs
      },
      {
        path: 'brand-boards',
        component: BrandBoards
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
