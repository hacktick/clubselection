<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import TimeSectionsTab from '../components/project/TimeSectionsTab.vue';
import CoursesTab from '../components/project/CoursesTab.vue';
import type { Tag, TimeSection } from '../types/models';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseTextarea, BaseAlert, BaseBadge, BaseEmptyState, BaseHeader, BaseSection, BaseCard } from '@/components/ui';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => route.name === 'project-edit' && !!projectId.value);

type TabName = 'general' | 'students' | 'tags' | 'sections' | 'courses';
const activeTab = ref<TabName>('general');

// General tab
const name = ref('');
const description = ref('');
const timezone = ref('');
const submissionStart = ref('');
const submissionEnd = ref('');

// Students tab
const studentsText = ref('');
const addingStudents = ref(false);
const studentCount = ref(0);
const deletingStudents = ref(false);
const students = ref<Array<{ id: string; name: string; token: string }>>([]);
const loadingStudents = ref(false);

// Tags tab
const tags = ref<Tag[]>([]);
const loadingTags = ref(false);
const showTagForm = ref(false);
const editingTagId = ref<string | null>(null);
const tagName = ref('');
const tagColor = ref('#667eea');
const tagMinRequired = ref(0);
const tagMaxAllowed = ref<number | null>(null);

// Sections (passed to components)
const sections = ref<TimeSection[]>([]);

// Template refs
const timeSectionsTabRef = ref<InstanceType<typeof TimeSectionsTab> | null>(null);

const loading = ref(false);
const error = ref('');

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

async function fetchProject() {
  if (!projectId.value) return;

  try {
    const response = await api.get(`/api/admin/projects/${projectId.value}`);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('project.failedToLoad');
      return;
    }

    const project = data.project;
    name.value = project.name;
    description.value = project.description || '';
    timezone.value = project.timezone || getBrowserTimezone();
    submissionStart.value = project.submissionStart ? project.submissionStart.slice(0, 16) : '';
    submissionEnd.value = project.submissionEnd ? project.submissionEnd.slice(0, 16) : '';
  } catch (err) {
    error.value = t('project.failedToLoad');
    console.error(err);
  }
}

async function saveProject() {
  if (!name.value.trim()) return;

  loading.value = true;
  error.value = '';

  const payload = {
    name: name.value,
    description: description.value || null,
    timezone: timezone.value || getBrowserTimezone(),
    submissionStart: submissionStart.value ? new Date(submissionStart.value).toISOString() : null,
    submissionEnd: submissionEnd.value ? new Date(submissionEnd.value).toISOString() : null,
  };

  try {
    const url = isEditMode.value
      ? `/api/admin/projects/${projectId.value}`
      : '/api/admin/projects';

    const response = isEditMode.value
      ? await api.put(url, payload)
      : await api.post(url, payload);

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('project.failedToSave');
      return;
    }

    if (!isEditMode.value && data.project?.id) {
      router.push(`/admin/projects/${data.project.id}`);
    }
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  } finally {
    loading.value = false;
  }
}

// Students
async function fetchStudents() {
  if (!projectId.value) return;

  loadingStudents.value = true;
  try {
    const response = await api.get(`/api/admin/projects/${projectId.value}/students`);
    const data = await response.json();
    students.value = data.students || [];
    studentCount.value = students.value.length;
  } catch (err) {
    console.error(err);
  } finally {
    loadingStudents.value = false;
  }
}

async function fetchStudentCount() {
  if (!projectId.value) return;

  try {
    const response = await api.get(`/api/admin/projects/${projectId.value}/students/count`);
    const data = await response.json();
    studentCount.value = data.count || 0;
  } catch (err) {
    console.error(err);
  }
}

async function handleAddStudents() {
  const identifiers = studentsText.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (identifiers.length === 0) return;

  addingStudents.value = true;
  error.value = '';

  try {
    const response = await api.post(`/api/admin/projects/${projectId.value}/students`, {
      identifiers
    });

    const data = await response.json();
    console.log('Add students response:', response.status, data);

    if (!response.ok) {
      error.value = data.error || data.message || t('student.failedToAdd');
      console.error('Error response:', data);
      return;
    }

    studentsText.value = '';
    await fetchStudents();
    error.value = '';
  } catch (err) {
    error.value = t('common.networkError');
    console.error('Network error:', err);
  } finally {
    addingStudents.value = false;
  }
}

async function handleDeleteAllStudents() {
  if (!confirm(t('student.deleteAllConfirm'))) return;

  deletingStudents.value = true;
  error.value = '';

  try {
    const response = await api.delete(`/api/admin/projects/${projectId.value}/students`);

    if (!response.ok) {
      const data = await response.json();
      error.value = data.error || t('student.failedToDelete');
      return;
    }

    students.value = [];
    studentCount.value = 0;
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  } finally {
    deletingStudents.value = false;
  }
}

// Tags
async function fetchTags() {
  if (!projectId.value) return;

  loadingTags.value = true;
  try {
    const response = await api.get(`/api/admin/projects/${projectId.value}/tags`);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('tag.failedToLoad');
      return;
    }

    tags.value = data.tags;
  } catch (err) {
    error.value = t('tag.failedToLoad');
    console.error(err);
  } finally {
    loadingTags.value = false;
  }
}

function openTagForm(tag?: Tag) {
  if (tag) {
    editingTagId.value = tag.id;
    tagName.value = tag.name;
    tagColor.value = tag.color;
    tagMinRequired.value = tag.minRequired;
    tagMaxAllowed.value = tag.maxAllowed;
  } else {
    editingTagId.value = null;
    tagName.value = '';
    tagColor.value = '#667eea';
    tagMinRequired.value = 0;
    tagMaxAllowed.value = null;
  }
  error.value = '';
  showTagForm.value = true;
}

async function saveTag() {
  if (!tagName.value.trim()) return;

  const minVal = Number(tagMinRequired.value);
  const maxVal = tagMaxAllowed.value !== null ? Number(tagMaxAllowed.value) : null;

  const payload = {
    name: tagName.value,
    color: tagColor.value,
    minRequired: isNaN(minVal) ? 0 : minVal,
    maxAllowed: maxVal !== null && !isNaN(maxVal) ? maxVal : null,
  };

  try {
    const url = editingTagId.value
      ? `/api/admin/projects/${projectId.value}/tags/${editingTagId.value}`
      : `/api/admin/projects/${projectId.value}/tags`;

    const response = editingTagId.value
      ? await api.put(url, payload)
      : await api.post(url, payload);

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('tag.failedToSave');
      return;
    }

    showTagForm.value = false;
    await fetchTags();
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  }
}

async function deleteTag(tagId: string) {
  if (!confirm(t('tag.confirmDelete'))) return;

  try {
    const response = await api.delete(`/api/admin/projects/${projectId.value}/tags/${tagId}`);

    if (!response.ok) {
      const data = await response.json();
      error.value = data.error || t('tag.failedToDelete');
      return;
    }

    await fetchTags();
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  }
}

// Sections
async function fetchSections() {
  if (!projectId.value) return;

  try {
    const response = await api.get(`/api/admin/projects/${projectId.value}/sections`);
    const data = await response.json();

    if (!response.ok) {
      return;
    }

    sections.value = data.sections;
  } catch (err) {
    console.error(err);
  }
}

// Initialize
if (isEditMode.value) {
  fetchProject();
  fetchTags();
  fetchStudents();
  fetchSections();
} else {
  timezone.value = getBrowserTimezone();
}
</script>

<template>
  <div>
    <BaseHeader :title="isEditMode ? t('project.edit') : t('project.new')" back-to="/admin" :back-label="t('project.backToProjects')" />

    <BaseSection>
      <nav data-tabs>
        <BaseButton
          variant="tag"
          :active="activeTab === 'general'"
          @click="activeTab = 'general'"
        >
          {{ t('common.general') }}
        </BaseButton>
        <BaseButton
          v-if="isEditMode"
          variant="tag"
          :active="activeTab === 'students'"
          @click="activeTab = 'students'"
        >
          {{ t('student.title') }}
        </BaseButton>
        <BaseButton
          v-if="isEditMode"
          variant="tag"
          :active="activeTab === 'tags'"
          @click="activeTab = 'tags'"
        >
          {{ t('tag.title') }}
        </BaseButton>
        <BaseButton
          v-if="isEditMode"
          variant="tag"
          :active="activeTab === 'sections'"
          @click="activeTab = 'sections'"
        >
          {{ t('timeSection.title') }}
        </BaseButton>
        <BaseButton
          v-if="isEditMode"
          variant="tag"
          :active="activeTab === 'courses'"
          @click="activeTab = 'courses'"
        >
          {{ t('course.title') }}
        </BaseButton>
      </nav>
    </BaseSection>

    <BaseSection>
      <!-- General Tab -->
      <BaseCard v-show="activeTab === 'general'" :title="t('project.details')">
        <form @submit.prevent="saveProject">
          <fieldset>
            <label for="name">{{ t('project.name') }} *</label>
            <BaseInput id="name" v-model="name" type="text" :placeholder="t('project.namePlaceholder')" required :disabled="loading" />
          </fieldset>

          <fieldset>
            <label for="description">{{ t('project.description') }}</label>
            <BaseTextarea id="description" v-model="description" :placeholder="t('project.descriptionPlaceholder')" :rows="4" :disabled="loading" />
          </fieldset>

          <div data-row>
            <fieldset>
              <label for="timezone">{{ t('project.timezone') }}</label>
              <BaseInput id="timezone" v-model="timezone" type="text" placeholder="UTC" :disabled="loading" />
              <small>{{ t('project.timezoneHint') }}</small>
            </fieldset>

            <fieldset>
              <label for="start">{{ t('project.submissionStart') }}</label>
              <BaseInput id="start" v-model="submissionStart" type="datetime-local" :disabled="loading" />
              <small>{{ t('project.submissionStartHint') }}</small>
            </fieldset>

            <fieldset>
              <label for="end">{{ t('project.submissionEnd') }}</label>
              <BaseInput id="end" v-model="submissionEnd" type="datetime-local" :disabled="loading" />
              <small>{{ t('project.submissionEndHint') }}</small>
            </fieldset>
          </div>

          <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>
        </form>

        <template #actions>
          <BaseButton type="button" @click="router.push('/admin')" variant="secondary" :disabled="loading">{{ t('common.cancel') }}</BaseButton>
          <BaseButton @click="saveProject" variant="primary" :loading="loading">
            {{ isEditMode ? t('common.saveChanges') : t('project.create') }}
          </BaseButton>
        </template>
      </BaseCard>

      <!-- Students Tab -->
      <BaseCard v-show="activeTab === 'students'" :title="t('student.add')">
        <template #titleActions>
          <BaseBadge status="info">{{ studentCount }} students</BaseBadge>
          <BaseButton v-if="studentCount > 0" @click="handleDeleteAllStudents" variant="danger" size="small" :loading="deletingStudents">
            {{ t('common.deleteAll') }}
          </BaseButton>
        </template>

        <p>{{ t('student.identifiersDescription') }}</p>

        <fieldset>
          <label for="student-identifiers">{{ t('student.identifiers') }}</label>
          <BaseTextarea
            id="student-identifiers"
            v-model="studentsText"
            :placeholder="t('student.identifiersPlaceholder')"
            :rows="10"
            :disabled="addingStudents"
          />
        </fieldset>

        <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

        <template #actions>
          <BaseButton @click="handleAddStudents" variant="primary" :disabled="addingStudents || !studentsText.trim()" :loading="addingStudents">
            {{ t('student.add') }}
          </BaseButton>
        </template>
      </BaseCard>

      <!-- Tags Tab -->
      <BaseCard v-show="activeTab === 'tags'" :title="t('tag.title')">
        <template #titleActions>
          <BaseButton @click="openTagForm()" variant="primary">+ {{ t('tag.addTag') }}</BaseButton>
        </template>

        <p>{{ t('tag.description') }}</p>

        <BaseEmptyState v-if="loadingTags" loading :message="t('tag.loadingTags')" />

        <BaseEmptyState v-else-if="tags.length === 0" :message="t('tag.noTagsHint')" />

        <table v-else>
          <thead>
            <tr>
              <th>{{ t('common.color') }}</th>
              <th>{{ t('common.name') }}</th>
              <th>{{ t('tag.minRequired') }}</th>
              <th>{{ t('tag.maxAllowed') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tag in tags" :key="tag.id" @click="openTagForm(tag)" data-clickable>
              <td>
                <div data-tag-color-swatch :style="{ backgroundColor: tag.color }"></div>
              </td>
              <td><strong>{{ tag.name }}</strong></td>
              <td>{{ tag.minRequired }}</td>
              <td>{{ tag.maxAllowed ?? t('common.unlimited') }}</td>
              <td data-actions>
                <BaseButton @click.stop="deleteTag(tag.id)" variant="danger" size="small">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>

      </BaseCard>

      <!-- Tag Form Modal -->
      <Teleport to="body">
        <div v-if="showTagForm" data-overlay @click="showTagForm = false">
          <BaseCard :title="editingTagId ? t('tag.edit') : t('tag.new')" @click.stop>
            <template #titleActions>
              <button data-close @click="showTagForm = false">×</button>
            </template>

            <fieldset>
              <label for="tag-name">{{ t('tag.name') }} *</label>
              <BaseInput id="tag-name" v-model="tagName" type="text" :placeholder="t('tag.namePlaceholder')" required />
            </fieldset>

            <fieldset>
              <label for="tag-color">{{ t('common.color') }}</label>
              <div data-color-picker>
                <BaseInput id="tag-color" v-model="tagColor" type="color" />
                <BaseInput v-model="tagColor" type="text" placeholder="#667eea" />
              </div>
            </fieldset>

            <div data-row>
              <fieldset>
                <label for="tag-min">{{ t('tag.minRequired') }}</label>
                <BaseInput id="tag-min" v-model="tagMinRequired" type="number" :min="0" placeholder="0" />
                <small>{{ t('tag.minRequiredHint') }}</small>
              </fieldset>

              <fieldset>
                <label for="tag-max">{{ t('tag.maxAllowed') }}</label>
                <BaseInput id="tag-max" v-model="tagMaxAllowed" type="number" :min="1" :placeholder="t('common.unlimited')" />
                <small>{{ t('tag.maxAllowedHint') }}</small>
              </fieldset>
            </div>

            <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

            <template #actions>
              <BaseButton @click="showTagForm = false" variant="secondary">{{ t('common.cancel') }}</BaseButton>
              <BaseButton @click="saveTag" variant="primary">{{ editingTagId ? t('common.update') : t('common.create') }}</BaseButton>
            </template>
          </BaseCard>
        </div>
      </Teleport>

      <!-- Time Sections Tab -->
      <BaseCard v-show="activeTab === 'sections'" :title="t('timeSection.title')">
        <template #titleActions>
          <BaseButton @click="timeSectionsTabRef?.openSectionForm()" variant="primary">+ {{ t('timeSection.addSection') }}</BaseButton>
        </template>
        <TimeSectionsTab v-if="projectId" ref="timeSectionsTabRef" :project-id="projectId" @update:sections="fetchSections" />
      </BaseCard>

      <!-- Courses Tab -->
      <BaseCard v-show="activeTab === 'courses'" :title="t('course.schedule')">
        <CoursesTab v-if="projectId" :project-id="projectId" :tags="tags" :sections="sections" />
      </BaseCard>
    </BaseSection>
  </div>
</template>
