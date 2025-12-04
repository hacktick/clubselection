<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/date';
import { BaseButton, BaseInput, BaseAlert, BaseBadge, BaseEmptyState, BaseHeader, BaseSection, BaseCard } from '@/components/ui';
import ImportProjectModal from '@/components/ImportProjectModal.vue';

const { t, locale } = useI18n();

interface Project {
  id: string;
  name: string;
  description: string | null;
  submissionStart: string | null;
  submissionEnd: string | null;
  completedCount: number;
  inProgressCount: number;
  createdAt: string;
}

const router = useRouter();

const projects = ref<Project[]>([]);
const loading = ref(true);
const error = ref('');

const siteTitle = ref('Club Selection Management');
const savingSiteTitle = ref(false);
const siteTitleSaveMessage = ref('');
const showImportModal = ref(false);

// Delete project state
const showDeleteModal = ref(false);
const projectToDelete = ref<Project | null>(null);
const deletingProject = ref(false);

function formatProjectDateTime(dateString: string | null): string {
  return formatDateTime(dateString, locale.value, t('common.notSet'));
}

async function fetchProjects() {
  try {
    const response = await api.get('/api/admin/projects');
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('project.failedToLoad');
      return;
    }

    projects.value = data.projects;
  } catch (err) {
    error.value = t('common.networkError');
    console.error('Error fetching projects:', err);
  } finally {
    loading.value = false;
  }
}

function viewProject(id: string) {
  router.push(`/admin/projects/${id}`);
}

function openCreateModal() {
  router.push('/admin/projects/new');
}

function onProjectImported(projectId: string) {
  router.push(`/admin/projects/${projectId}`);
}

async function fetchSiteTitle() {
  try {
    const response = await api.get('/api/settings/site_title');
    const data = await response.json();

    if (response.ok && data.setting) {
      siteTitle.value = data.setting.value;
    }
  } catch (err) {
    console.error('Error fetching site title:', err);
  }
}

async function saveSiteTitle() {
  if (!siteTitle.value.trim()) return;

  savingSiteTitle.value = true;
  siteTitleSaveMessage.value = '';

  try {
    const response = await api.put('/api/admin/settings/site_title', {
      value: siteTitle.value,
    });

    const data = await response.json();

    if (!response.ok) {
      siteTitleSaveMessage.value = data.error || t('admin.failedToSave');
      return;
    }

    siteTitleSaveMessage.value = t('messages.savedSuccessfully');

    window.dispatchEvent(new CustomEvent('settings-updated', {
      detail: { key: 'site_title', value: siteTitle.value }
    }));

    setTimeout(() => {
      siteTitleSaveMessage.value = '';
    }, 3000);
  } catch (err) {
    siteTitleSaveMessage.value = t('common.networkError');
    console.error('Error saving site title:', err);
  } finally {
    savingSiteTitle.value = false;
  }
}

function onSiteTitleInput() {
  window.dispatchEvent(new CustomEvent('settings-updated', {
    detail: { key: 'site_title', value: siteTitle.value }
  }));
}

async function exportProject(id: string, event: Event) {
  event.stopPropagation();
  try {
    const response = await api.get(`/api/admin/projects/${id}/export`);
    if (!response.ok) {
      const data = await response.json();
      console.error('Export failed:', data.error);
      return;
    }
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'project-export.yml';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting project:', err);
  }
}

function openDeleteModal(project: Project, event: Event) {
  event.stopPropagation();
  projectToDelete.value = project;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  projectToDelete.value = null;
}

async function confirmDeleteProject() {
  if (!projectToDelete.value) return;

  deletingProject.value = true;
  try {
    const response = await api.delete(`/api/admin/projects/${projectToDelete.value.id}`);
    if (!response.ok) {
      const data = await response.json();
      error.value = data.error || t('project.failedToDelete');
      return;
    }
    projects.value = projects.value.filter(p => p.id !== projectToDelete.value?.id);
    closeDeleteModal();
  } catch (err) {
    error.value = t('common.networkError');
    console.error('Error deleting project:', err);
  } finally {
    deletingProject.value = false;
  }
}

onMounted(() => {
  fetchProjects();
  fetchSiteTitle();
});
</script>

<template>
  <div>
    <BaseHeader :title="t('admin.dashboard')" />

    <BaseSection>
      <BaseCard :title="t('nav.settings')">
        <fieldset>
          <label for="site-title">{{ t('admin.siteTitle') }}</label>
          <BaseInput
            id="site-title"
            v-model="siteTitle"
            @input="onSiteTitleInput"
            type="text"
            :placeholder="t('admin.siteTitlePlaceholder')"
            :disabled="savingSiteTitle"
          />
          <BaseAlert
            v-if="siteTitleSaveMessage"
            :type="siteTitleSaveMessage.includes('error') || siteTitleSaveMessage.includes('Failed') ? 'error' : 'success'"
          >
            {{ siteTitleSaveMessage }}
          </BaseAlert>
        </fieldset>
        <template #actions>
          <BaseButton
            @click="saveSiteTitle"
            variant="primary"
            :disabled="savingSiteTitle || !siteTitle.trim()"
            :loading="savingSiteTitle"
          >
            {{ t('common.save') }}
          </BaseButton>
        </template>
      </BaseCard>
      <BaseCard :title="t('project.title')">
        <template #titleActions>
          <BaseButton variant="secondary" size="small" @click="showImportModal = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {{ t('common.import') }}
          </BaseButton>
          <BaseButton variant="primary" size="small" @click="openCreateModal">+ {{ t('common.new') }}</BaseButton>
        </template>

        <BaseEmptyState v-if="loading" loading :message="t('project.loadingProjects')" />

        <BaseAlert v-else-if="error && projects.length === 0" type="error">
          {{ error }}
        </BaseAlert>

        <BaseEmptyState v-else-if="projects.length === 0" :message="t('project.noProjectsYet')" />

        <table v-else>
          <thead>
            <tr>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('common.period') }}</th>
              <th>{{ t('common.completed') }}</th>
              <th>{{ t('common.inProgress') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="project in projects"
              :key="project.id"
              data-clickable
              @click="viewProject(project.id)"
            >
              <td>
                <strong>{{ project.name }}</strong>
                <small v-if="project.description">{{ project.description }}</small>
              </td>
              <td>
                <span data-date-range>
                  {{ formatProjectDateTime(project.submissionStart) }} — {{ formatProjectDateTime(project.submissionEnd) }}
                </span>
              </td>
              <td><BaseBadge status="success">{{ project.completedCount }}</BaseBadge></td>
              <td><BaseBadge status="warning">{{ project.inProgressCount }}</BaseBadge></td>
              <td data-actions>
                <BaseButton size="small" variant="secondary" @click="exportProject(project.id, $event)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {{ t('common.export') }}
                </BaseButton>
                <BaseButton size="small" variant="danger" @click="openDeleteModal(project, $event)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  {{ t('common.delete') }}
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </BaseSection>

    <ImportProjectModal
      v-model="showImportModal"
      @imported="onProjectImported"
    />

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" data-overlay @click="closeDeleteModal">
        <BaseCard :title="t('project.deleteConfirmTitle')" @click.stop>
          <template #titleActions>
            <button data-close @click="closeDeleteModal">×</button>
          </template>

          <p>{{ t('project.deleteConfirmMessage', { name: projectToDelete?.name }) }}</p>
          <p><strong>{{ t('project.deleteWarning') }}</strong></p>

          <template #actions>
            <BaseButton variant="secondary" @click="closeDeleteModal" :disabled="deletingProject">
              {{ t('common.cancel') }}
            </BaseButton>
            <BaseButton variant="danger" @click="confirmDeleteProject" :loading="deletingProject">
              {{ t('project.delete') }}
            </BaseButton>
          </template>
        </BaseCard>
      </div>
    </Teleport>
  </div>
</template>
