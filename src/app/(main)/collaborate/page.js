"use client";
import { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from "@/src/app/components/additionals/userContext";
import ProtectedRoute from "@/src/app/components/additionals/protectedRoute";

function CollaborateContent() {
  const { isAuthenticated, loading } = useContext(UserContext);
  const router = useRouter();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Collaborate</h1>
      <p>Welcome to the Collaborate page!</p>
    </div>
  );
}

export default function Collaborate() {
  return (
    <ProtectedRoute>
      <CollaborateContent />
    </ProtectedRoute>
  );
}
