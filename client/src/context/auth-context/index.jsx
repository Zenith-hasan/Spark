import { Skeleton } from "@/components/ui/skeleton";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import { checkAuthService, loginService, registerService } from "@/services";
import { createContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [signInFormData, setSignInFormData] = useState(initialSignInFormData);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleRegisterUser(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await registerService(signUpFormData);
      if (data.success) {
        toast.success("Registration successful! Logging you in...");
        // After successful registration, try to log in automatically
        const loginData = await loginService({
          userEmail: signUpFormData.userEmail,
          password: signUpFormData.password,
        });
        
        if (loginData.success) {
          localStorage.setItem(
            "accessToken",
            JSON.stringify(loginData.data.accessToken)
          );
          localStorage.setItem(
            "refreshToken",
            JSON.stringify(loginData.data.refreshToken)
          );
          setAuth({
            authenticate: true,
            user: loginData.data.user,
          });
          toast.success("Successfully logged in!");
          navigate("/home");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
      setAuth({
        authenticate: false,
        user: null,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLoginUser(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await loginService(signInFormData);
      if (data.success) {
        localStorage.setItem(
          "accessToken",
          JSON.stringify(data.data.accessToken)
        );
        localStorage.setItem(
          "refreshToken",
          JSON.stringify(data.data.refreshToken)
        );
        setAuth({
          authenticate: true,
          user: data.data.user,
        });
        toast.success("Successfully logged in!");
        navigate("/home");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
      setAuth({
        authenticate: false,
        user: null,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function checkAuthUser() {
    try {
      const data = await checkAuthService();
      if (data.success) {
        setAuth({
          authenticate: true,
          user: data.data.user,
        });
      } else {
        setAuth({
          authenticate: false,
          user: null,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuth({
        authenticate: false,
        user: null,
      });
    } finally {
      setLoading(false);
    }
  }

  function resetCredentials() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAuth({
      authenticate: false,
      user: null,
    });
    navigate("/auth");
  }

  useEffect(() => {
    checkAuthUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        auth,
        resetCredentials,
        loading,
        isSubmitting,
      }}
    >
      {loading ? <Skeleton className="w-full h-screen" /> : children}
    </AuthContext.Provider>
  );
}