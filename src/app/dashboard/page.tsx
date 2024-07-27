"use client"

import { Suspense } from "react";
import Dashboard from "../components/Dashboard";

export default function Page() {
	return (
		<Suspense>
			<Dashboard />
		</Suspense>
	)
}