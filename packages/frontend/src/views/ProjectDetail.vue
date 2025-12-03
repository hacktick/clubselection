<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseTextarea, BaseAlert, BaseBadge, BaseEmptyState, BaseHeader, BaseSection, BaseCard } from '@/components/ui';
import ExportSubmissionsModal from '@/components/ExportSubmissionsModal.vue';

const { t } = useI18n();

interface Enrollment {
  id: string;
  studentName: string;
  studentToken: string;
  courseName: string;
  status: string;
  createdAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  submissionStart: string | null;
  submissionEnd: string | null;
  submissionCount: number;
  enrollments: Enrollment[];
  createdAt: string;
}

const route = useRoute();
const router = useRouter();

const project = ref<ProjectData | null>(null);
const loading = ref(true);
const error = ref('');
const showDeleteDialog = ref(false);
const deleting = ref(false);
const showEditModal = ref(false);
const showExportModal = ref(false);
const editName = ref('');
const editDescription = ref('');
const editing = ref(false);
const enrollmentUrl = computed(() => {
  if (!project.value) return '';
  return `${window.location.origin}/enroll?token=STUDENT_TOKEN_HERE`;
});
const copied = ref(false);

const hasSubmissions = computed(() => {
  return project.value ? project.value.submissionCount > 0 : false;
});

const canEdit = computed(() => !hasSubmissions.value);

function formatDate(dateString: string | null): string {
  if (!dateString) return t('common.notSet');
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchProject() {
  const id = route.params.id as string;

  try {
    const response = await api.get(`/api/admin/projects/${id}`);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('project.failedToLoad');
      return;
    }

    project.value = data.project;
  } catch (err) {
    error.value = t('common.networkError');
    console.error('Error fetching project:', err);
  } finally {
    loading.value = false;
  }
}

async function deleteAllSubmissions() {
  if (!project.value) return;

  deleting.value = true;
  try {
    const response = await api.delete(`/api/admin/projects/${project.value.id}/submissions`);

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('submission.failedToDelete');
      return;
    }

    showDeleteDialog.value = false;
    await fetchProject();
  } catch (err) {
    error.value = t('common.networkError');
    console.error('Error deleting submissions:', err);
  } finally {
    deleting.value = false;
  }
}

function openEditModal() {
  if (!project.value || !canEdit.value) return;
  router.push(`/admin/projects/${project.value.id}/edit`);
}

async function updateProject() {
  if (!project.value || !editName.value.trim()) return;

  editing.value = true;
  try {
    const response = await api.put(`/api/admin/projects/${project.value.id}`, {
      name: editName.value,
      description: editDescription.value || null,
    });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('project.failedToUpdate');
      return;
    }

    showEditModal.value = false;
    await fetchProject();
  } catch (err) {
    error.value = t('common.networkError');
    console.error('Error updating project:', err);
  } finally {
    editing.value = false;
  }
}

async function copyEnrollmentUrl() {
  try {
    await navigator.clipboard.writeText(enrollmentUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

onMounted(() => {
  fetchProject();
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <section data-bg="glow" data-padding="section" v-if="loading">
      <BaseEmptyState loading :message="t('project.loadingDetails')" />
    </section>

    <!-- Error State -->
    <section data-bg="glow" data-padding="section" v-else-if="error && !project">
      <article>
        <h2>⚠️ {{ t('project.failedToLoad') }}</h2>
        <p>{{ error }}</p>
        <BaseButton @click="router.push('/admin')" variant="primary">{{ t('project.backToDashboard') }}</BaseButton>
      </article>
    </section>

    <!-- Project Content -->
    <template v-else-if="project">
      <BaseHeader :title="project.name" back-to="/admin" :back-label="t('project.backToDashboard')">
        <template #actions>
          <BaseButton
            @click="openEditModal"
            variant="secondary"
            :disabled="!canEdit"
            :title="canEdit ? t('project.edit') : t('project.cannotEditWithSubmissions')"
          >
            ✏️ {{ t('common.edit') }}
          </BaseButton>
          <BaseButton
            v-if="hasSubmissions"
            @click="showDeleteDialog = true"
            variant="danger"
          >
            🗑️ {{ t('submission.deleteAll') }}
          </BaseButton>
        </template>
      </BaseHeader>

      <BaseSection v-if="project.description">
        <BaseCard>
          <p>{{ project.description }}</p>
        </BaseCard>
      </BaseSection>

      <BaseSection>
        <div data-grid="cards">
          <BaseCard>
            <small>{{ t('project.submissionStart') }}</small>
            <h3>{{ formatDate(project.submissionStart) }}</h3>
          </BaseCard>
          <BaseCard>
            <small>{{ t('project.submissionEnd') }}</small>
            <h3>{{ formatDate(project.submissionEnd) }}</h3>
          </BaseCard>
          <BaseCard>
            <small>{{ t('project.totalSubmissions') }}</small>
            <h3>{{ project.submissionCount }}</h3>
          </BaseCard>
        </div>
      </BaseSection>

      <!-- Enrollment Link -->
      <BaseSection>
        <BaseCard :title="t('student.enrollment')">
          <p>{{ t('student.enrollmentDescription') }}</p>
          <fieldset>
            <BaseInput
              :model-value="enrollmentUrl"
              readonly
              @click="($event.target as HTMLInputElement).select()"
            />
            <BaseButton @click="copyEnrollmentUrl" :variant="copied ? 'success' : 'primary'">
              {{ copied ? '✓ ' + t('common.copied') : '📋 ' + t('common.copy') }}
            </BaseButton>
          </fieldset>
          <small>{{ t('common.note') }}: {{ t('student.tokenNote') }}</small>
        </BaseCard>
      </BaseSection>

      <!-- Submissions List -->
      <BaseSection>
        <BaseCard :title="t('submission.title')">
          <template #titleActions>
            <BaseButton variant="secondary" size="small" @click="showExportModal = true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ t('common.export') }}
            </BaseButton>
          </template>
          <BaseEmptyState v-if="project.enrollments.length === 0" :message="t('submission.noSubmissions')" />

          <table v-else>
            <thead>
              <tr>
                <th>{{ t('common.date') }}</th>
                <th>{{ t('student.student') }}</th>
                <th>{{ t('course.title') }}</th>
                <th>{{ t('common.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="enrollment in project.enrollments" :key="enrollment.id">
                <td>{{ formatDateTime(enrollment.createdAt) }}</td>
                <td>
                  <strong>{{ enrollment.studentName }}</strong>
                  <small>{{ enrollment.studentToken }}</small>
                </td>
                <td>{{ enrollment.courseName }}</td>
                <td>
                  <BaseBadge :status="enrollment.status.toLowerCase() === 'confirmed' ? 'success' : enrollment.status.toLowerCase() === 'pending' ? 'warning' : 'error'">
                    {{ enrollment.status }}
                  </BaseBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </BaseCard>
      </BaseSection>
    </template>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteDialog" data-overlay @click="showDeleteDialog = false">
      <article @click.stop>
        <h2>⚠️ {{ t('submission.deleteAllConfirm') }}</h2>
        <p>{{ t('submission.deleteAllWarning', { count: project?.submissionCount }) }}</p>

        <footer>
          <BaseButton @click="showDeleteDialog = false" variant="secondary" :disabled="deleting">
            {{ t('common.cancel') }}
          </BaseButton>
          <BaseButton @click="deleteAllSubmissions" variant="danger" :loading="deleting">
            {{ t('common.deleteAll') }}
          </BaseButton>
        </footer>
      </article>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" data-overlay @click="showEditModal = false">
      <article @click.stop>
        <header>
          <h2>{{ t('project.edit') }}</h2>
          <button data-close @click="showEditModal = false">×</button>
        </header>

        <form @submit.prevent="updateProject">
          <fieldset>
            <label for="edit-name">{{ t('project.name') }} *</label>
            <BaseInput
              id="edit-name"
              v-model="editName"
              type="text"
              :placeholder="t('project.namePlaceholder')"
              required
              :disabled="editing"
            />
          </fieldset>

          <fieldset>
            <label for="edit-description">{{ t('common.descriptionOptional') }}</label>
            <BaseTextarea
              id="edit-description"
              v-model="editDescription"
              :placeholder="t('project.descriptionPlaceholder')"
              :rows="4"
              :disabled="editing"
            />
          </fieldset>

          <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

          <footer>
            <BaseButton type="button" @click="showEditModal = false" variant="secondary" :disabled="editing">
              {{ t('common.cancel') }}
            </BaseButton>
            <BaseButton type="submit" variant="primary" :loading="editing">
              {{ t('common.saveChanges') }}
            </BaseButton>
          </footer>
        </form>
      </article>
    </div>

    <!-- Export Submissions Modal -->
    <ExportSubmissionsModal
      v-if="project"
      v-model="showExportModal"
      :project-id="project.id"
      :project-name="project.name"
    />
  </div>
</template>
