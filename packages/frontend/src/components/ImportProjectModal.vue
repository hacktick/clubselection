<script setup lang="ts">
import { ref, computed } from 'vue';
import { parse as parseYaml } from 'yaml';
import { api } from '@/services/api';
import { BaseModal, BaseButton, BaseInput, BaseAlert } from '@/components/ui';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'imported': [projectId: string];
}>();

interface ParsedProject {
  name: string;
  description?: string | null;
  timezone?: string;
  submissionStart?: string | null;
  submissionEnd?: string | null;
  timeSections?: Array<{
    label: string;
    startTime: string;
    endTime: string;
  }>;
  tags?: Array<{
    name: string;
    color?: string;
    minRequired?: number;
    maxAllowed?: number;
  }>;
  courses?: Array<{
    name: string;
    description?: string | null;
    capacity?: number | null;
    tags?: string[];
    occurrences?: Array<{
      dayOfWeek: string;
      section: string;
    }>;
  }>;
}

const step = ref<'upload' | 'configure'>('upload');
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const parsedData = ref<ParsedProject | null>(null);
const projectName = ref('');
const error = ref('');
const importing = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function resetState() {
  step.value = 'upload';
  isDragging.value = false;
  parsedData.value = null;
  projectName.value = '';
  error.value = '';
  importing.value = false;
}

function close() {
  isOpen.value = false;
  resetState();
}

function openFilePicker() {
  fileInput.value?.click();
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

async function handleFile(file: File) {
  error.value = '';

  if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
    error.value = 'Bitte wählen Sie eine YAML-Datei (.yml oder .yaml)';
    return;
  }

  try {
    const text = await file.text();
    const data = parseYaml(text) as ParsedProject;

    if (!data || typeof data !== 'object') {
      error.value = 'Ungültiges YAML-Format';
      return;
    }

    if (!data.name) {
      error.value = 'Die YAML-Datei muss einen Projektnamen enthalten';
      return;
    }

    parsedData.value = data;
    projectName.value = data.name;
    step.value = 'configure';
  } catch (err) {
    error.value = 'Fehler beim Lesen der Datei: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler');
  }
}

async function importProject() {
  if (!parsedData.value || !projectName.value.trim()) return;

  importing.value = true;
  error.value = '';

  try {
    const importData = {
      ...parsedData.value,
      name: projectName.value.trim(),
    };

    const response = await api.post('/api/admin/projects/import', importData);
    const data = await response.json();

    if (!response.ok) {
      error.value = data.error || 'Import fehlgeschlagen';
      return;
    }

    emit('imported', data.project.id);
    close();
  } catch (err) {
    error.value = 'Netzwerkfehler. Bitte versuchen Sie es erneut.';
    console.error('Error importing project:', err);
  } finally {
    importing.value = false;
  }
}

function getSummary() {
  if (!parsedData.value) return null;
  return {
    sections: parsedData.value.timeSections?.length ?? 0,
    tags: parsedData.value.tags?.length ?? 0,
    courses: parsedData.value.courses?.length ?? 0,
  };
}
</script>

<template>
  <BaseModal v-model="isOpen" :title="step === 'upload' ? 'Projekt importieren' : 'Projektname festlegen'" large>
    <div v-if="step === 'upload'" class="import-upload">
      <div
        class="drop-zone"
        :class="{ 'drop-zone--active': isDragging }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="openFilePicker"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".yml,.yaml"
          style="display: none"
          @change="onFileSelected"
        />
        <div class="drop-zone__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p class="drop-zone__text">
          <strong>Klicken</strong> oder Datei hierher ziehen
        </p>
        <p class="drop-zone__hint">Nur .yml Dateien</p>
      </div>

      <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>
    </div>

    <div v-else-if="step === 'configure'" class="import-configure">
      <fieldset>
        <label for="project-name">Projektname</label>
        <BaseInput
          id="project-name"
          v-model="projectName"
          type="text"
          placeholder="Name des Projekts"
        />
      </fieldset>

      <div v-if="getSummary()" class="import-summary">
        <h4>Inhalt der Datei:</h4>
        <ul>
          <li><strong>{{ getSummary()!.sections }}</strong> Zeitabschnitte</li>
          <li><strong>{{ getSummary()!.tags }}</strong> Kategorien</li>
          <li><strong>{{ getSummary()!.courses }}</strong> Kurse</li>
        </ul>
      </div>

      <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>
    </div>

    <template #footer>
      <div class="modal-actions">
        <BaseButton variant="secondary" @click="close" :disabled="importing">
          Abbrechen
        </BaseButton>
        <BaseButton
          v-if="step === 'configure'"
          variant="primary"
          @click="importProject"
          :disabled="!projectName.trim() || importing"
          :loading="importing"
        >
          Importieren
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style>
.import-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drop-zone {
  border: 2px dashed var(--color-border, #ccc);
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-bg-secondary, #f9f9f9);
}

.drop-zone:hover,
.drop-zone--active {
  border-color: var(--color-primary, #007bff);
  background: var(--color-bg-hover, #f0f7ff);
}

.drop-zone__icon {
  color: var(--color-text-muted, #666);
  margin-bottom: 1rem;
}

.drop-zone--active .drop-zone__icon {
  color: var(--color-primary, #007bff);
}

.drop-zone__text {
  margin: 0 0 0.5rem;
  color: var(--color-text, #333);
}

.drop-zone__hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #666);
}

.import-configure {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.import-summary {
  background: var(--color-bg-secondary, #f9f9f9);
  border-radius: 8px;
  padding: 1rem;
}

.import-summary h4 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #666);
}

.import-summary ul {
  margin: 0;
  padding-left: 1.25rem;
}

.import-summary li {
  margin: 0.25rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
