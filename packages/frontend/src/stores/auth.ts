import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Admin {
    id: string;
    username: string;
    name: string;
}

interface Student {
    id: string;
    name: string | null;
    token: string;
}

export const useAuthStore = defineStore('auth', () => {
    const admin = ref<Admin | null>(null);
    const student = ref<Student | null>(null);
    const jwtToken = ref<string | null>(null);
    const isAdminLoggedIn = ref(false);

    // Load from localStorage on init
    const storedAdmin = localStorage.getItem('admin');
    const storedToken = localStorage.getItem('jwtToken');

    if (storedAdmin && storedToken) {
        try {
            admin.value = JSON.parse(storedAdmin);
            jwtToken.value = storedToken;
            isAdminLoggedIn.value = true;
        } catch (e) {
            localStorage.removeItem('admin');
            localStorage.removeItem('jwtToken');
        }
    }

    function setAdmin(adminData: Admin, token: string) {
        admin.value = adminData;
        jwtToken.value = token;
        isAdminLoggedIn.value = true;
        localStorage.setItem('admin', JSON.stringify(adminData));
        localStorage.setItem('jwtToken', token);
    }

    function setStudent(studentData: Student, token: string) {
        student.value = studentData;
        jwtToken.value = token;
        // Store student token in sessionStorage (not persistent across browser sessions)
        sessionStorage.setItem('student', JSON.stringify(studentData));
        sessionStorage.setItem('jwtToken', token);
    }

    function logout() {
        admin.value = null;
        student.value = null;
        jwtToken.value = null;
        isAdminLoggedIn.value = false;
        localStorage.removeItem('admin');
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('student');
        sessionStorage.removeItem('jwtToken');
    }

    function getAuthHeader() {
        if (jwtToken.value) {
            return {
                'Authorization': `Bearer ${jwtToken.value}`
            };
        }
        return {};
    }

    return {
        admin,
        student,
        jwtToken,
        isAdminLoggedIn,
        setAdmin,
        setStudent,
        logout,
        getAuthHeader,
    };
});
