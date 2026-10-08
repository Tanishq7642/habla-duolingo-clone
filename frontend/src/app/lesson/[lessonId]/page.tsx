"use client";

import { notFound, useParams } from "next/navigation";

import { LessonPlayer } from "@/components/lesson/LessonPlayer";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);
  if (!Number.isInteger(lessonId) || lessonId <= 0) notFound();
  // key: navigating lesson → lesson must reset the whole machine.
  return <LessonPlayer key={lessonId} source={{ kind: "lesson", lessonId }} />;
}
