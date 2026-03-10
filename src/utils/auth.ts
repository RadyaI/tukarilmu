import { auth, db } from "../config/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 2 * 60 * 1000;
const SESSION_DURATION = 14 * 24 * 60 * 60 * 1000;

export const checkIsAdmin = async (uid: string): Promise<boolean> => {
    try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.role === "admin";
        }
        return false;
    } catch (error) {
        return false;
    }
};

export const checkAutoLogout = async () => {
    const sessionStart = localStorage.getItem("session_start");
    if (sessionStart) {
        const now = new Date().getTime();
        if (now - parseInt(sessionStart) > SESSION_DURATION) {
            await signOut(auth);
            localStorage.removeItem("session_start");
            localStorage.removeItem("login_attempts");
            localStorage.removeItem("lockout_time");
            return true;
        }
    }
    return false;
};

const handleFailedAttempt = () => {
    const attempts = parseInt(localStorage.getItem("login_attempts") || "0");
    const newAttempts = attempts + 1;
    localStorage.setItem("login_attempts", newAttempts.toString());

    if (newAttempts >= MAX_ATTEMPTS) {
        localStorage.setItem("lockout_time", new Date().getTime().toString());
        throw new Error("Terlalu banyak percobaan gagal. Silakan tunggu 2 menit.");
    }
    throw new Error(`Email atau password salah. Percobaan tersisa: ${MAX_ATTEMPTS - newAttempts}`);
};

const checkLockout = () => {
    const lockoutTime = localStorage.getItem("lockout_time");
    if (lockoutTime) {
        const now = new Date().getTime();
        const timePassed = now - parseInt(lockoutTime);
        if (timePassed < LOCKOUT_DURATION) {
            const timeLeft = Math.ceil((LOCKOUT_DURATION - timePassed) / 1000);
            throw new Error(`Akun terkunci sementara. Coba lagi dalam ${timeLeft} detik.`);
        } else {
            localStorage.removeItem("login_attempts");
            localStorage.removeItem("lockout_time");
        }
    }
};

export const loginWithEmail = async (email: string, password: string) => {
    checkLockout();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem("session_start", new Date().getTime().toString());
        localStorage.removeItem("login_attempts");
        localStorage.removeItem("lockout_time");

        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                userId: userCredential.user.uid,
                name: userCredential.user.displayName || email.split("@")[0],
                email: userCredential.user.email,
                provider: "password",
                role: "mahasiswa",
                createdAt: serverTimestamp(),
            });
        }
        return userCredential.user;
    } catch (error: any) {
        if (
            error.code === 'auth/wrong-password' ||
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/invalid-credential'
        ) {
            handleFailedAttempt();
        }
        throw error;
    }
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem("session_start", new Date().getTime().toString());

    await setDoc(doc(db, "users", userCredential.user.uid), {
        userId: userCredential.user.uid,
        name: name,
        email: userCredential.user.email,
        provider: "password",
        role: "mahasiswa",
        tag: "Mahasiswa",
        createdAt: serverTimestamp(),
    });

    return userCredential.user;
};

export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    localStorage.setItem("session_start", new Date().getTime().toString());

    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const role = userCredential.user.email === "radyaiftikhar@gmail.com" ? "admin" : "mahasiswa";
        await setDoc(userDocRef, {
            userId: userCredential.user.uid,
            name: userCredential.user.displayName,
            email: userCredential.user.email,
            avatar: userCredential.user.photoURL,
            provider: "google",
            role: role,
            tag: "Mahasiswa",
            createdAt: serverTimestamp(),
        });
    }
    return userCredential.user;
};