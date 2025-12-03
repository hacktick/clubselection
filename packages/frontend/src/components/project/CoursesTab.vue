<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Course, CourseOccurrence, Tag, TimeSection } from '../../types/models';
import { api } from '@/services/api';
import { BaseButton, BaseInput, BaseTextarea, BaseAlert, BaseBadge, BaseEmptyState, BaseCard, BaseSelect } from '@/components/ui';

const { t } = useI18n();

const props = defineProps<{
  projectId: string;
  tags: Tag[];
  sections: TimeSection[];
}>();

const DAYS_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const dayOptions = computed(() =>
  DAYS_KEYS.map((key, i) => ({ value: i, label: t(`days.${key}`) }))
);

const sectionOptions = computed(() =>
  props.sections.map(section => ({
    value: section.id,
    label: `${section.label} (${section.startTime} - ${section.endTime})`
  }))
);

const courses = ref<Course[]>([]);
const loadingCourses = ref(false);
const showCourseForm = ref(false);
const editingCourseId = ref<string | null>(null);
const courseName = ref('');
const courseDescription = ref('');
const courseCapacity = ref<number | null>(null);
const courseTagIds = ref<string[]>([]);
const courseOccurrences = ref<CourseOccurrence[]>([]);
const error = ref('');

async function fetchCourses() {
  loadingCourses.value = true;
  try {
    const response = await api.get(`/api/admin/projects/${props.projectId}/courses`);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('course.failedToLoad');
      return;
    }

    courses.value = data.courses;
  } catch (err) {
    error.value = t('course.failedToLoad');
    console.error(err);
  } finally {
    loadingCourses.value = false;
  }
}

function getCoursesAtSlot(day: number, sectionId: string): Course[] {
  return courses.value.filter(course =>
    course.occurrences.some(occ =>
      occ.dayOfWeek === day && occ.sectionId === sectionId
    )
  );
}

function handleCalendarClick(day: number, sectionId: string) {
  editingCourseId.value = null;
  courseName.value = '';
  courseDescription.value = '';
  courseCapacity.value = null;
  courseTagIds.value = [];
  courseOccurrences.value = [{ dayOfWeek: day, sectionId }];
  error.value = '';
  showCourseForm.value = true;
}

function editCourse(courseId: string) {
  const course = courses.value.find(c => c.id === courseId);
  if (!course) return;

  editingCourseId.value = course.id;
  courseName.value = course.name;
  courseDescription.value = course.description || '';
  courseCapacity.value = course.capacity;
  courseTagIds.value = course.tags.map(t => t.id);
  courseOccurrences.value = course.occurrences.map(occ => ({
    id: occ.id,
    dayOfWeek: occ.dayOfWeek,
    sectionId: occ.sectionId,
  }));
  error.value = '';
  showCourseForm.value = true;
}

function addOccurrence() {
  const firstSection = props.sections[0];
  if (!firstSection) {
    error.value = t('course.createSectionsFirst');
    return;
  }

  courseOccurrences.value.push({
    dayOfWeek: 0,
    sectionId: firstSection.id,
  });
}

function removeOccurrence(index: number) {
  if (courseOccurrences.value.length > 1) {
    courseOccurrences.value.splice(index, 1);
  }
}

async function saveCourse() {
  error.value = '';

  if (!courseName.value.trim()) {
    error.value = t('course.nameRequired');
    return;
  }

  if (courseOccurrences.value.length === 0) {
    error.value = t('course.occurrenceRequired');
    return;
  }

  const payload = {
    name: courseName.value,
    description: courseDescription.value || null,
    capacity: courseCapacity.value && courseCapacity.value > 0 ? courseCapacity.value : null,
    tagIds: courseTagIds.value,
    occurrences: courseOccurrences.value.map(occ => ({
      dayOfWeek: occ.dayOfWeek,
      sectionId: occ.sectionId,
    })),
  };

  try {
    const url = editingCourseId.value
      ? `/api/admin/projects/${props.projectId}/courses/${editingCourseId.value}`
      : `/api/admin/projects/${props.projectId}/courses`;

    const response = editingCourseId.value
      ? await api.put(url, payload)
      : await api.post(url, payload);

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('course.failedToSave');
      return;
    }

    showCourseForm.value = false;
    await fetchCourses();
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  }
}

async function deleteCourse(courseId: string) {
  if (!confirm(t('course.confirmDelete'))) return;

  try {
    const response = await api.delete(`/api/admin/projects/${props.projectId}/courses/${courseId}`);

    if (!response.ok) {
      const data = await response.json();
      error.value = data.error || t('course.failedToDelete');
      return;
    }

    showCourseForm.value = false;
    await fetchCourses();
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  }
}

// Fetch on mount
fetchCourses();
</script>

<template>
  <div>
    <p>{{ t('course.calendarHint') }}</p>

    <BaseEmptyState v-if="loadingCourses" loading :message="t('course.loadingCourses')" />

    <BaseEmptyState v-else-if="sections.length === 0" :message="t('course.noSectionsHint')" />

    <div v-else data-calendar>
      <table>
        <thead>
          <tr>
            <th>{{ t('common.time') }}</th>
            <th v-for="(key, index) in DAYS_KEYS" :key="index">{{ t(`days.${key}`) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="section in sections" :key="section.id">
            <td data-time-cell>
              <strong>{{ section.startTime }} - {{ section.endTime }}</strong>
              <small>{{ section.label }}</small>
            </td>
            <td
              v-for="(key, dayIndex) in DAYS_KEYS"
              :key="`${section.id}-${dayIndex}`"
              @click="handleCalendarClick(dayIndex, section.id)"
            >
              <div
                v-for="course in getCoursesAtSlot(dayIndex, section.id)"
                :key="course.id"
                data-course-card
                @click.stop="editCourse(course.id)"
              >
                <strong>{{ course.name }}</strong>
                <div data-tags>
                  <BaseBadge
                    v-for="tag in course.tags"
                    :key="tag.id"
                    :color="tag.color"
                  >
                    {{ tag.name }}
                  </BaseBadge>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Course Form Modal -->
    <Teleport to="body">
      <div v-if="showCourseForm" data-overlay @click="showCourseForm = false">
        <BaseCard :title="editingCourseId ? t('course.edit') : t('course.new')" @click.stop data-modal-large>
          <template #titleActions>
            <button data-close @click="showCourseForm = false">×</button>
          </template>

          <fieldset>
            <label for="course-name">{{ t('course.name') }} *</label>
            <BaseInput
              id="course-name"
              v-model="courseName"
              type="text"
              :placeholder="t('course.namePlaceholder')"
              required
            />
          </fieldset>

          <fieldset>
            <label for="course-description">{{ t('course.description') }}</label>
            <BaseTextarea
              id="course-description"
              v-model="courseDescription"
              :placeholder="t('course.descriptionPlaceholder')"
              :rows="3"
            />
          </fieldset>

          <div data-row>
            <fieldset>
              <label for="course-capacity">{{ t('course.capacity') }}</label>
              <BaseInput
                id="course-capacity"
                v-model="courseCapacity"
                type="number"
                :min="1"
                :placeholder="t('common.unlimited')"
              />
              <small>{{ t('course.capacityHint') }}</small>
            </fieldset>

            <fieldset>
              <label>{{ t('tag.title') }}</label>
              <div v-if="tags.length === 0" data-empty-inline>
                <small>{{ t('course.noTagsHint') }}</small>
              </div>
              <div v-else data-tag-checkboxes>
                <label v-for="tag in tags" :key="tag.id">
                  <input
                    type="checkbox"
                    :value="tag.id"
                    v-model="courseTagIds"
                  />
                  <span data-tag-color :style="{ backgroundColor: tag.color }"></span>
                  <span>{{ tag.name }}</span>
                </label>
              </div>
            </fieldset>
          </div>

          <fieldset>
            <header data-card-header>
              <label>{{ t('course.occurrences') }} *</label>
              <BaseButton @click="addOccurrence" variant="secondary" size="small">+ {{ t('course.addOccurrence') }}</BaseButton>
            </header>
            <div data-occurrences>
              <table>
                <thead>
                  <tr>
                    <th>{{ t('course.day') }}</th>
                    <th>{{ t('course.timeSection') }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(occ, index) in courseOccurrences" :key="index">
                    <td>
                      <BaseSelect
                        :model-value="occ.dayOfWeek"
                        @update:model-value="occ.dayOfWeek = Number($event)"
                        :options="dayOptions"
                      />
                    </td>
                    <td>
                      <BaseSelect
                        v-model="occ.sectionId"
                        :options="sectionOptions"
                      />
                    </td>
                    <td>
                      <BaseButton
                        @click="removeOccurrence(index)"
                        variant="danger"
                        size="small"
                        :disabled="courseOccurrences.length === 1"
                      >
                        🗑️
                      </BaseButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </fieldset>

          <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

          <template #actions>
            <BaseButton
              v-if="editingCourseId"
              @click="deleteCourse(editingCourseId)"
              variant="danger"
            >
              🗑️ {{ t('course.delete') }}
            </BaseButton>
            <BaseButton @click="showCourseForm = false" variant="secondary">{{ t('common.cancel') }}</BaseButton>
            <BaseButton @click="saveCourse" variant="primary">
              {{ editingCourseId ? t('common.update') : t('common.create') }}
            </BaseButton>
          </template>
        </BaseCard>
      </div>
    </Teleport>
  </div>
</template>
