<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TimeSection } from '../../types/models';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseAlert, BaseBadge, BaseEmptyState, BaseCard } from '@/components/ui';

const { t } = useI18n();

const props = defineProps<{
  projectId: string;
}>();

const emit = defineEmits<{
  'update:sections': [];
}>();

const sections = ref<TimeSection[]>([]);
const loadingSections = ref(false);
const showSectionForm = ref(false);
const editingSectionId = ref<string |null>(null);
const sectionLabel = ref('');
const sectionStartTime = ref('09:00');
const sectionEndTime = ref('10:00');
const error = ref('');

async function fetchSections() {
  loadingSections.value = true;
  try {
    const response = await api.get(`/api/admin/projects/${props.projectId}/sections`);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('timeSection.failedToLoad');
      return;
    }

    sections.value = data.sections;
  } catch (err) {
    error.value = t('timeSection.failedToLoad');
    console.error(err);
  } finally {
    loadingSections.value = false;
  }
}

function openSectionForm(section?: TimeSection) {
  if (section) {
    editingSectionId.value = section.id;
    sectionLabel.value = section.label;
    sectionStartTime.value = section.startTime;
    sectionEndTime.value = section.endTime;
  } else {
    editingSectionId.value = null;
    sectionLabel.value = '';
    sectionStartTime.value = '09:00';
    sectionEndTime.value = '10:00';
  }
  error.value = '';
  showSectionForm.value = true;
}

async function saveSection() {
  if (!sectionLabel.value.trim()) return;

  const payload = {
    label: sectionLabel.value,
    startTime: sectionStartTime.value,
    endTime: sectionEndTime.value,
  };

  try {
    const url = editingSectionId.value
      ? `/api/admin/projects/${props.projectId}/sections/${editingSectionId.value}`
      : `/api/admin/projects/${props.projectId}/sections`;

    const response = editingSectionId.value
      ? await api.put(url, payload)
      : await api.post(url, payload);

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || data.message || t('timeSection.failedToSave');
      return;
    }

    showSectionForm.value = false;
    await fetchSections();
    emit('update:sections');
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  }
}

async function deleteSection(sectionId: string) {
  if (!confirm(t('timeSection.confirmDelete'))) return;

  try {
    const response = await api.delete(`/api/admin/projects/${props.projectId}/sections/${sectionId}`);

    const data = await response.json();

    if (!response.ok) {
      error.value = data.message || data.error || t('timeSection.failedToDelete');
      return;
    }

    await fetchSections();
    emit('update:sections');
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  }
}

// Expose methods for parent component
defineExpose({
  openSectionForm,
});

// Fetch on mount
fetchSections();
</script>

<template>
  <div>
    <p>{{ t('timeSection.description') }}</p>

    <BaseEmptyState v-if="loadingSections" loading :message="t('timeSection.loadingSections')" />

    <BaseEmptyState v-else-if="sections.length === 0" :message="t('timeSection.noSections')" />

    <table v-else>
      <thead>
        <tr>
          <th>{{ t('timeSection.label') }}</th>
          <th>{{ t('timeSection.startTime') }}</th>
          <th>{{ t('timeSection.endTime') }}</th>
          <th>{{ t('common.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="section in sections" :key="section.id" @click="openSectionForm(section)" data-clickable>
          <td><strong>{{ section.label }}</strong></td>
          <td>{{ section.startTime }}</td>
          <td>{{ section.endTime }}</td>
          <td>
            <nav>
              <BaseButton @click.stop="deleteSection(section.id)" variant="danger" size="small">🗑️</BaseButton>
            </nav>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Section Form Modal -->
    <Teleport to="body">
      <div v-if="showSectionForm" data-overlay @click="showSectionForm = false">
        <BaseCard :title="editingSectionId ? t('timeSection.edit') : t('timeSection.new')" @click.stop>
          <template #titleActions>
            <button data-close @click="showSectionForm = false">×</button>
          </template>

          <fieldset>
            <label for="section-label">{{ t('timeSection.label') }} *</label>
            <BaseInput
              id="section-label"
              v-model="sectionLabel"
              type="text"
              :placeholder="t('timeSection.labelPlaceholder')"
              required
            />
          </fieldset>

          <div data-row>
            <fieldset>
              <label for="section-start">{{ t('timeSection.startTime') }} *</label>
              <BaseInput
                id="section-start"
                v-model="sectionStartTime"
                type="time"
                required
              />
            </fieldset>

            <fieldset>
              <label for="section-end">{{ t('timeSection.endTime') }} *</label>
              <BaseInput
                id="section-end"
                v-model="sectionEndTime"
                type="time"
                required
              />
            </fieldset>
          </div>

          <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

          <template #actions>
            <BaseButton @click="showSectionForm = false" variant="secondary">{{ t('common.cancel') }}</BaseButton>
            <BaseButton @click="saveSection" variant="primary">
              {{ editingSectionId ? t('common.update') : t('common.create') }}
            </BaseButton>
          </template>
        </BaseCard>
      </div>
    </Teleport>
  </div>
</template>
