<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { BaseButton, BaseAlert, BaseBadge, BaseEmptyState, BaseHeader, BaseSection, BaseCard } from '@/components/ui';

const { t } = useI18n();

interface TimeSection {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  order: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  minRequired: number;
  maxAllowed: number | null;
}

interface CourseOccurrence {
  id: string;
  dayOfWeek: number;
  sectionId: string;
  section: TimeSection;
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  occurrences: CourseOccurrence[];
  tags: Tag[];
  isEnrolled: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  timezone: string;
  submissionStart: string | null;
  submissionEnd: string | null;
  timeSections: TimeSection[];
  tags: Tag[];
  courses: Course[];
  hasSubmitted: boolean;
}

const localizedDays = computed(() => [
  t('days.monday'),
  t('days.tuesday'),
  t('days.wednesday'),
  t('days.thursday'),
  t('days.friday'),
  t('days.saturday'),
  t('days.sunday')
]);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const project = ref<Project | null>(null);
const loading = ref(true);
const error = ref('');
const selectedTagId = ref<string | null>(null);
const hoveredCourseId = ref<string | null>(null);
const selectedCourse = ref<Course | null>(null);
const hasSubmitted = ref(false);
const submitting = ref(false);

function openCourseDialog(course: Course) {
  selectedCourse.value = course;
}

function closeCourseDialog() {
  selectedCourse.value = null;
}

const filteredCourses = computed(() => {
  if (!project.value) return [];
  if (!selectedTagId.value) return project.value.courses;

  return project.value.courses.filter((course) =>
    course.tags.some((tag) => tag.id === selectedTagId.value)
  );
});

const activeDays = computed(() => {
  if (!project.value) return [];

  const daysWithCourses = new Set<number>();
  project.value.courses.forEach((course) => {
    course.occurrences.forEach((occ) => {
      daysWithCourses.add(occ.dayOfWeek);
    });
  });

  return localizedDays.value.map((day, index) => ({ day, index }))
    .filter(({ index }) => daysWithCourses.has(index));
});

interface TagRequirement {
  tag: Tag;
  enrolled: number;
  minRequired: number;
  maxAllowed: number | null;
  metMinimum: boolean;
  metMaximum: boolean;
}

const tagRequirements = computed<TagRequirement[]>(() => {
  if (!project.value) return [];

  return project.value.tags.map((tag) => {
    // Count enrolled courses for this tag
    const enrolledCount = project.value!.courses.filter((course) =>
      course.isEnrolled && course.tags.some((t) => t.id === tag.id)
    ).length;

    const metMinimum = enrolledCount >= tag.minRequired;
    const metMaximum = tag.maxAllowed === null || enrolledCount <= tag.maxAllowed;

    return {
      tag,
      enrolled: enrolledCount,
      minRequired: tag.minRequired,
      maxAllowed: tag.maxAllowed,
      metMinimum,
      metMaximum,
    };
  });
});

const isReadyToSubmit = computed(() => {
  return tagRequirements.value.every((req) => req.metMinimum && req.metMaximum);
});

const unmetRequirements = computed(() => {
  return tagRequirements.value.filter((req) => !req.metMinimum || !req.metMaximum);
});

function getCoursesAtSlot(day: number, sectionId: string): Course[] {
  return filteredCourses.value.filter((course) =>
    course.occurrences.some((occ) => occ.dayOfWeek === day && occ.sectionId === sectionId)
  );
}

async function fetchProjectDetail() {
  const projectId = route.params.id as string;

  if (!authStore.student?.token) {
    router.push('/enroll');
    return;
  }

  try {
    const response = await api.get(`/api/students/${authStore.student.token}/projects/${projectId}`);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || t('studentProjectDetail.failedToLoad');
      return;
    }

    project.value = data.project;
    hasSubmitted.value = data.project.hasSubmitted || false;
  } catch (err) {
    error.value = t('common.networkError');
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function enrollInCourse(courseId: string) {
  if (!authStore.student?.token || !project.value) {
    return;
  }

  try {
    const response = await api.post(`/api/students/${authStore.student.token}/enroll`, {
      courseId
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || t('studentProjectDetail.failedToEnroll'));
      return;
    }

    // Refresh project data to show updated enrollment status
    await fetchProjectDetail();
  } catch (err) {
    alert(t('common.networkError'));
    console.error(err);
  }
}

async function unenrollFromCourse(courseId: string) {
  if (!authStore.student?.token || !project.value) {
    return;
  }

  if (!confirm(t('studentProjectDetail.confirmUnenroll'))) {
    return;
  }

  try {
    const response = await api.delete(`/api/students/${authStore.student.token}/enroll/${courseId}`);

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || t('studentProjectDetail.failedToUnenroll'));
      return;
    }

    // Refresh project data to show updated enrollment status
    await fetchProjectDetail();
  } catch (err) {
    alert(t('common.networkError'));
    console.error(err);
  }
}

async function handleSubmit() {
  const projectId = route.params.id as string;

  if (!authStore.student?.token) {
    router.push('/enroll');
    return;
  }

  if (!isReadyToSubmit.value) {
    alert(t('studentProjectDetail.meetRequirements'));
    return;
  }

  if (hasSubmitted.value) {
    alert(t('studentProjectDetail.alreadySubmitted'));
    return;
  }

  if (!confirm(t('studentProjectDetail.confirmSubmit'))) {
    return;
  }

  submitting.value = true;
  try {
    const response = await api.post(`/api/students/${authStore.student.token}/projects/${projectId}/submit`, {});

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || t('studentProjectDetail.failedToSubmit'));
      return;
    }

    hasSubmitted.value = true;
    alert(t('studentProjectDetail.submitSuccess'));
  } catch (err) {
    alert(t('common.networkError'));
    console.error(err);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchProjectDetail();
});
</script>

<template>
  <div>
    <BaseHeader
      v-if="project"
      :title="project.name"
      back-to="/student/projects"
      :back-label="t('studentProjectDetail.backToProjects')"
    />
    <BaseHeader v-else :title="t('common.loading')" back-to="/student/projects" :back-label="t('studentProjectDetail.backToProjects')" />

    <BaseSection>
      <!-- Loading State -->
      <BaseCard v-if="loading">
        <BaseEmptyState loading :message="t('studentProjectDetail.loadingProject')" />
      </BaseCard>

      <!-- Error State -->
      <BaseCard v-else-if="error" :title="t('common.error')">
        <BaseAlert type="error">{{ error }}</BaseAlert>
        <template #actions>
          <BaseButton @click="router.push('/student/projects')" variant="primary">
            {{ t('studentProjectDetail.backToProjects') }}
          </BaseButton>
        </template>
      </BaseCard>

      <template v-else-if="project">
        <!-- Project Description -->
        <BaseCard v-if="project.description" :title="t('studentProjectDetail.aboutProject')">
          <p>{{ project.description }}</p>
        </BaseCard>

        <!-- Submission Status Card -->
        <BaseCard :title="t('studentProjectDetail.enrollmentStatus')">
          <BaseAlert v-if="hasSubmitted" type="success">
            <strong>{{ t('studentProjectDetail.submittedSuccess') }}</strong>
          </BaseAlert>

          <template v-else-if="isReadyToSubmit">
            <BaseAlert type="success">
              <strong>{{ t('studentProjectDetail.readyToSubmit') }}</strong> {{ t('studentProjectDetail.allRequirementsMet') }}
            </BaseAlert>
          </template>

          <template v-else>
            <BaseAlert type="warning">
              <strong>{{ t('studentProjectDetail.requirementsNotMet') }}</strong>
              <ul>
                <li v-for="req in unmetRequirements" :key="req.tag.id">
                  <strong>{{ req.tag.name }}</strong>:
                  <span v-if="!req.metMinimum">
                    {{ t('studentProjectDetail.needMore', { count: req.minRequired - req.enrolled }) }}
                    ({{ req.enrolled }}/{{ req.minRequired }} {{ t('studentProjectDetail.minimum') }})
                  </span>
                  <span v-else-if="!req.metMaximum">
                    {{ t('studentProjectDetail.tooManySelected') }}
                    ({{ req.enrolled }}/{{ req.maxAllowed }} {{ t('studentProjectDetail.maximum') }})
                  </span>
                </li>
              </ul>
            </BaseAlert>
          </template>

          <template #actions>
            <BaseButton
              v-if="!hasSubmitted"
              :variant="isReadyToSubmit ? 'success' : 'primary'"
              :disabled="!isReadyToSubmit"
              :loading="submitting"
              @click="handleSubmit"
            >
              {{ t('studentProjectDetail.submitEnrollment') }}
            </BaseButton>
          </template>
        </BaseCard>

        <!-- Tag Filter -->
        <BaseCard :title="t('studentProjectDetail.filterByCategory')">
          <p>{{ t('studentProjectDetail.filterDescription') }}</p>
          <div data-tag-filters>
            <BaseButton
              variant="tag"
              :active="selectedTagId === null"
              @click="selectedTagId = null"
            >
              {{ t('studentProjectDetail.allCourses') }}
            </BaseButton>
            <BaseButton
              v-for="tag in project.tags"
              :key="tag.id"
              variant="tag"
              :active="selectedTagId === tag.id"
              :style="{
                backgroundColor: selectedTagId === tag.id ? tag.color : 'transparent',
                borderColor: tag.color,
                color: selectedTagId === tag.id ? 'white' : tag.color
              }"
              @click="selectedTagId = tag.id"
            >
              {{ tag.name }}
              <small v-if="tag.minRequired > 0 || tag.maxAllowed">
                ({{ tagRequirements.find(r => r.tag.id === tag.id)?.enrolled || 0 }}/{{ tag.minRequired }}{{ tag.maxAllowed ? `-${tag.maxAllowed}` : '+' }})
              </small>
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Calendar Grid -->
        <BaseCard :title="t('studentProjectDetail.courseSchedule')">
          <p>{{ t('studentProjectDetail.scheduleDescription') }}</p>

          <BaseEmptyState
            v-if="!project.timeSections || project.timeSections.length === 0"
            :message="t('studentProjectDetail.noTimeSections')"
          />

          <div v-else data-calendar>
            <table>
              <thead>
                <tr>
                  <th>{{ t('studentProjectDetail.time') }}</th>
                  <th v-for="{ day, index } in activeDays" :key="index">{{ day }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="section in project.timeSections" :key="section.id">
                  <td data-time-cell>
                    <strong>{{ section.label }}</strong>
                    <small>{{ section.startTime }} - {{ section.endTime }}</small>
                  </td>
                  <td v-for="{ index } in activeDays" :key="`${section.id}-${index}`">
                    <div
                      v-for="course in getCoursesAtSlot(index, section.id)"
                      :key="course.id"
                      data-course-card
                      :data-enrolled="course.isEnrolled ? '' : undefined"
                      :data-dimmed="hoveredCourseId && hoveredCourseId !== course.id ? '' : undefined"
                      @mouseenter="hoveredCourseId = course.id"
                      @mouseleave="hoveredCourseId = null"
                      @click="openCourseDialog(course)"
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
                      <BaseBadge v-if="course.isEnrolled" status="success">{{ t('studentProjectDetail.enrolled') }}</BaseBadge>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </template>
    </BaseSection>

    <!-- Course Dialog -->
    <Teleport to="body">
      <div v-if="selectedCourse" data-overlay @click="closeCourseDialog">
        <BaseCard :title="selectedCourse.name" @click.stop>
          <template #titleActions>
            <button data-close @click="closeCourseDialog">×</button>
          </template>

          <div data-tags>
            <BaseBadge
              v-for="tag in selectedCourse.tags"
              :key="tag.id"
              :color="tag.color"
            >
              {{ tag.name }}
            </BaseBadge>
          </div>

          <fieldset v-if="selectedCourse.description">
            <label>{{ t('studentProjectDetail.description') }}</label>
            <p>{{ selectedCourse.description }}</p>
          </fieldset>

          <fieldset v-if="selectedCourse.capacity">
            <label>{{ t('studentProjectDetail.capacity') }}</label>
            <p>{{ t('studentProjectDetail.capacityStudents', { count: selectedCourse.capacity }) }}</p>
          </fieldset>

          <template #actions>
            <BaseButton
              v-if="!selectedCourse.isEnrolled"
              variant="primary"
              @click="enrollInCourse(selectedCourse.id); closeCourseDialog()"
            >
              {{ t('studentProjectDetail.joinCourse') }}
            </BaseButton>
            <template v-else>
              <BaseBadge status="success">{{ t('studentProjectDetail.enrolled') }}</BaseBadge>
              <BaseButton
                variant="danger"
                @click="unenrollFromCourse(selectedCourse.id); closeCourseDialog()"
              >
                {{ t('studentProjectDetail.leaveCourse') }}
              </BaseButton>
            </template>
          </template>
        </BaseCard>
      </div>
    </Teleport>
  </div>
</template>
