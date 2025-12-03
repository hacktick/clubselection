<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { BaseButton, BaseAlert, BaseBadge, BaseEmptyState, BaseHeader, BaseSection, BaseCard } from '@/components/ui';

const { t, locale } = useI18n();

interface Project {
  id: string;
  name: string;
  description: string | null;
  submissionStart: string | null;
  submissionEnd: string | null;
  hasEnrollment: boolean;
  hasSubmitted: boolean;
}

type ProjectStatus = 'waiting' | 'open' | 'finished';

const router = useRouter();
const authStore = useAuthStore();

const projects = ref<Project[]>([]);
const loading = ref(true);
const error = ref('');
const studentName = ref('');

function getProjectStatus(project: Project): ProjectStatus {
  const now = new Date();
  const start = project.submissionStart ? new Date(project.submissionStart) : null;
  const end = project.submissionEnd ? new Date(project.submissionEnd) : null;

  if (start && now < start) {
    return 'waiting';
  }
  if (end && now > end) {
    return 'finished';
  }
  return 'open';
}

function getStatusBadgeVariant(status: ProjectStatus): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'open': return 'success';
    case 'waiting': return 'warning';
    case 'finished': return 'neutral';
  }
}

function formatStatus(status: ProjectStatus): string {
  return t(`studentProjects.status.${status}`);
}

const dateLocale = computed(() => locale.value === 'de' ? 'de-DE' : 'en-US');

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(dateLocale.value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function navigateToProject(projectId: string) {
  router.push(`/student/project/${projectId}`);
}

async function fetchStudentProjects() {
  if (!authStore.student?.token) {
    router.push('/enroll');
    return;
  }

  try {
    const response = await api.get(`/api/students/${authStore.student.token}/projects`);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('studentProjects.failedToLoad');
      loading.value = false;
      return;
    }

    studentName.value = data.student.name || 'Student';
    projects.value = data.projects;

    // Auto-redirect logic: if exactly 1 open project without enrollment, go to it
    const openProjects = projects.value.filter(
      (p) => getProjectStatus(p) === 'open' && !p.hasEnrollment
    );

    if (openProjects.length === 1) {
      router.push(`/student/project/${openProjects[0].id}`);
    }
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchStudentProjects();
});
</script>

<template>
  <div>
    <BaseHeader :title="studentName ? t('studentProjects.welcome', { name: studentName }) : t('studentProjects.myProjects')" />

    <BaseSection>
      <BaseCard :title="t('studentProjects.yourProjects')">
        <p>{{ t('studentProjects.selectProject') }}</p>

        <BaseEmptyState v-if="loading" loading :message="t('studentProjects.loadingProjects')" />

        <BaseAlert v-else-if="error" type="error">{{ error }}</BaseAlert>

        <BaseEmptyState v-else-if="projects.length === 0" :message="t('studentProjects.noProjects')" />

        <table v-else>
          <thead>
            <tr>
              <th>{{ t('studentProjects.project') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('studentProjects.progress') }}</th>
              <th>{{ t('studentProjects.startDate') }}</th>
              <th>{{ t('studentProjects.endDate') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="project in projects"
              :key="project.id"
              @click="navigateToProject(project.id)"
              data-clickable
            >
              <td>
                <strong>{{ project.name }}</strong>
                <small v-if="project.description">{{ project.description }}</small>
              </td>
              <td>
                <BaseBadge :status="getStatusBadgeVariant(getProjectStatus(project))">
                  {{ formatStatus(getProjectStatus(project)) }}
                </BaseBadge>
              </td>
              <td>
                <BaseBadge v-if="project.hasSubmitted" status="success">{{ t('studentProjects.progressStatus.submitted') }}</BaseBadge>
                <BaseBadge v-else-if="project.hasEnrollment" status="info">{{ t('studentProjects.progressStatus.inProgress') }}</BaseBadge>
                <BaseBadge v-else status="neutral">{{ t('studentProjects.progressStatus.notStarted') }}</BaseBadge>
              </td>
              <td>{{ formatDate(project.submissionStart) }}</td>
              <td>{{ formatDate(project.submissionEnd) }}</td>
              <td>
                <nav>
                  <BaseButton @click.stop="navigateToProject(project.id)" variant="primary" size="small">
                    {{ t('studentProjects.view') }}
                  </BaseButton>
                </nav>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </BaseSection>
  </div>
</template>
