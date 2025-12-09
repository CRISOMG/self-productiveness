import type { FormError, FormSubmitEvent } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";

export function useAuthController() {
  const supabase = useSupabaseClient();

  const authStore = useAuthStore();
  const authStoreRefs = storeToRefs(authStore);
  const config = useRuntimeConfig();
  const state = reactive({
    email: config.public.test_email,
    password: undefined,
  });

  async function signInWithEmail({ email }: { email: string }) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
    });

    return { data, error };
  }
  async function signInWithEmailPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  }

  onMounted(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      authStoreRefs.eventSessionLogs.value[event] = session;
      authStoreRefs.user.value = session?.user;
    });
  });

  onMounted(() => {
    defineShortcuts({
      ctrl_shift_q: () => {
        confirm("Are you sure you want to sign out?") &&
          supabase.auth.signOut();
      },
    });
  });

  type Schema = typeof state;

  function validate(state: Partial<Schema>): FormError[] {
    const errors = [];
    if (!state.email) errors.push({ name: "email", message: "Required" });
    if (!state.password) errors.push({ name: "password", message: "Required" });
    return errors;
  }

  const toast = useSuccessErrorToast();
  async function handleLogin({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const { data, error } = await signInWithEmailPassword({
      email: email,
      password: password,
    });
    if (error) {
      toast.addErrorToast({ title: "Error", description: error.message });
      return;
    } else {
      toast.addSuccessToast({
        title: "Success",
        description: "The form has been submitted.",
      });
      navigateTo("/");
    }
  }

  async function handleSignUp({
    email,
    password,
    username,
    fullname,
  }: {
    email: string;
    password: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          fullname,
        },
      },
    });
    if (error) {
      toast.addErrorToast({ title: "Error", description: error.message });
      return;
    } else {
      toast.addSuccessToast({
        title: "Success",
        description: "The form has been submitted.",
      });
      navigateTo("/login");
    }
  }

  async function handleLoginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    localStorage.setItem("auth-google", JSON.stringify(data));
    if (error) {
      toast.addErrorToast({ title: "Error", description: error.message });
      return;
    } else {
      toast.addSuccessToast({
        title: "Success",
        description: "The form has been submitted.",
      });
      navigateTo("/");
    }
  }
  async function handleLoginWithGithub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    localStorage.setItem("auth-github", JSON.stringify(data));
    if (error) {
      toast.addErrorToast({ title: "Error", description: error.message });
      return;
    } else {
      toast.addSuccessToast({
        title: "Success",
        description: "The form has been submitted.",
      });
      navigateTo("/");
    }
  }
  return {
    state,
    validate,
    handleLogin,
    handleSignUp,
    authStoreRefs,
    signInWithEmail,
    signInWithEmailPassword,
    toast,
    handleLoginWithGoogle,
    handleLoginWithGithub,
  };
}
