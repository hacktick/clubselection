import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Enroll from '../views/Enroll.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import ProjectDetail from '../views/ProjectDetail.vue'
import ProjectForm from '../views/ProjectForm.vue'
import StudentProjects from '../views/StudentProjects.vue'
import StudentProjectDetail from '../views/StudentProjectDetail.vue'
import Embed from '../views/Embed.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/enroll',
            name: 'enroll',
            component: Enroll
        },
        {
            path: '/admin',
            name: 'admin',
            component: AdminDashboard,
            meta: { requiresAdmin: true }
        },
        {
            path: '/admin/projects/new',
            name: 'project-create',
            component: ProjectForm,
            meta: { requiresAdmin: true }
        },
        {
            path: '/admin/projects/:id',
            name: 'project-detail',
            component: ProjectDetail,
            meta: { requiresAdmin: true }
        },
        {
            path: '/admin/projects/:id/edit',
            name: 'project-edit',
            component: ProjectForm,
            meta: { requiresAdmin: true }
        },
        {
            path: '/student/projects',
            name: 'student-projects',
            component: StudentProjects,
            meta: { requiresStudent: true }
        },
        {
            path: '/student/project/:id',
            name: 'student-project-detail',
            component: StudentProjectDetail,
            meta: { requiresStudent: true }
        },
        {
            path: '/embed',
            name: 'embed',
            component: Embed
        }
    ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // Check if route requires admin authentication
    if (to.meta.requiresAdmin) {
        if (!authStore.admin || !authStore.jwtToken) {
            // Redirect to home if not authenticated as admin
            next('/');
            return;
        }
    }

    // Check if route requires student authentication
    if (to.meta.requiresStudent) {
        if (!authStore.student || !authStore.jwtToken) {
            // Redirect to home if not authenticated as student
            next('/');
            return;
        }
    }

    next();
})

export default router
