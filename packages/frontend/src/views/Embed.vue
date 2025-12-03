<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

interface EmbedData {
    project: {
        id: string;
        name: string;
    };
    hasSubmitted: boolean;
    submittedAt: string | null;
    status: 'waiting' | 'open' | 'closed';
    statusMessage: string;
}

const route = useRoute();

const data = ref<EmbedData | null>(null);
const loading = ref(true);
const error = ref('');

const badgeStatus = computed(() => {
    if (!data.value) return 'neutral';
    if (data.value.hasSubmitted) return 'success';
    switch (data.value.status) {
        case 'waiting': return 'warning';
        case 'open': return 'info';
        case 'closed': return 'neutral';
        default: return 'neutral';
    }
});

const badgeText = computed(() => {
    if (!data.value) return '';
    if (data.value.hasSubmitted) return 'Submitted';
    switch (data.value.status) {
        case 'waiting': return 'Waiting';
        case 'open': return 'Open';
        case 'closed': return 'Closed';
        default: return '';
    }
});

async function fetchEmbedData() {
    const token = route.query.token as string;
    const project = route.query.project as string | undefined;

    if (!token) {
        error.value = 'No token provided';
        loading.value = false;
        return;
    }

    try {
        const url = project
            ? `/api/embed?token=${encodeURIComponent(token)}&project=${encodeURIComponent(project)}`
            : `/api/embed?token=${encodeURIComponent(token)}`;

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
            error.value = result.error || 'Failed to load data';
            loading.value = false;
            return;
        }

        data.value = result;
    } catch (err) {
        error.value = 'Network error';
        console.error(err);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchEmbedData();
});
</script>

<template>
    <div style="padding: 12px; min-height: 80px; display: flex; align-items: center; justify-content: center;">
        <div v-if="loading">
            <span data-spinner></span>
        </div>

        <div v-else-if="error" style="color: var(--color-error); font-size: 0.875rem;">
            {{ error }}
        </div>

        <article v-else-if="data" data-light style="max-width: 400px; width: 100%; padding: 1rem 1.25rem;">
            <h3 style="margin-bottom: 0.5rem;">{{ data.project.name }}</h3>
            <p style="margin-bottom: 0.5rem;">
                <mark :data-status="badgeStatus">{{ badgeText }}</mark>
            </p>
            <small>{{ data.statusMessage }}</small>
        </article>
    </div>
</template>
