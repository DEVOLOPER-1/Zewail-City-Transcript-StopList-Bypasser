from __future__ import annotations

import json
from typing import Any


def normalize_text(value: Any) -> str:
    """Convert transcript values into clean display strings."""

    if value is None:
        return ""
    return " ".join(str(value).split())


def parse_response_text(raw_text: str) -> dict[str, Any]:
    """Decode the double-encoded `response.json` payload into a dictionary."""

    payload: Any = json.loads(raw_text)
    if isinstance(payload, str):
        payload = json.loads(payload)

    if not isinstance(payload, dict):
        raise ValueError("Transcript payload must decode to a dictionary.")

    return payload


def load_response_file(path: str = "response.json") -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as file:
        return parse_response_text(file.read())


def extract_header(data: dict[str, Any]) -> dict[str, Any]:
    headers = data.get("data", {}).get("headerInformation", [])
    return headers[0] if headers else {}


def build_course_record(course: dict[str, Any]) -> dict[str, str]:
    return {
        "course_id": normalize_text(course.get("eventId")),
        "course_name": normalize_text(course.get("eventName")),
        "subtype": normalize_text(course.get("eventSubType")),
        "credits": normalize_text(course.get("credits")),
        "grade": normalize_text(course.get("finalGrade")),
        "quality_points": normalize_text(course.get("qualityPoints")),
    }


def build_gpa_summary(gpa_entries: list[dict[str, Any]]) -> dict[str, str]:
    term = next((entry for entry in gpa_entries if entry.get("gpaType") == "T"), {})
    overall = next((entry for entry in gpa_entries if entry.get("gpaType") == "O"), {})

    return {
        "term_gpa": normalize_text(term.get("gpa")),
        "term_attempted_credits": normalize_text(term.get("attemptedCredits")),
        "overall_gpa": normalize_text(overall.get("gpa")),
        "overall_attempted_credits": normalize_text(overall.get("attemptedCredits")),
    }


def build_transcript_view_model(data: dict[str, Any]) -> dict[str, Any]:
    header = extract_header(data)
    semesters: list[dict[str, Any]] = []

    for semester in header.get("transcriptYearTerm", []):
        organizations: list[dict[str, Any]] = []
        for organization in semester.get("transcriptOrganization", []):
            organizations.append(
                {
                    "name": normalize_text(organization.get("organizationName")),
                    "courses": [
                        build_course_record(course)
                        for course in organization.get("transcriptCourses", [])
                    ],
                }
            )

        semesters.append(
            {
                "period": normalize_text(semester.get("period")),
                "gpa": build_gpa_summary(semester.get("transcriptGpa", [])),
                "organizations": organizations,
            }
        )

    return {
        "student_name": normalize_text(header.get("fullName")),
        "institution": normalize_text(header.get("orgName")),
        "cumulative_gpa": normalize_text(header.get("cumGpa")),
        "semesters": semesters,
    }


def iter_course_records(data: dict[str, Any]):
    """Yield flattened course rows for debugging or alternative table rendering."""

    for semester in build_transcript_view_model(data)["semesters"]:
        for organization in semester["organizations"]:
            for course in organization["courses"]:
                yield {
                    "period": semester["period"],
                    "organization": organization["name"],
                    **course,
                }


if __name__ == "__main__":
    transcript = load_response_file()
    view_model = build_transcript_view_model(transcript)
    print(json.dumps(view_model, ensure_ascii=False, indent=2))
