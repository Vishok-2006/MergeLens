import os
import json
from typing import List

class FrameworkDetector:
    """Intelligently detects languages, tech stacks, and backend/frontend frameworks."""

    @classmethod
    def detect_framework(cls, base_path: str) -> str:
        """
        Analyzes standard files in repository workspace to identify matching framework architecture.
        """
        # Read package.json if present
        package_json_path = os.path.join(base_path, "package.json")
        package_data = {}
        if os.path.exists(package_json_path):
            try:
                with open(package_json_path, 'r', encoding='utf-8', errors='ignore') as f:
                    package_data = json.load(f)
            except Exception:
                pass

        dependencies = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}

        # 1. Node/Frontend/Fullstack JavaScript/TypeScript framework checks
        if "next" in dependencies:
            return "Next.js"
        if "react" in dependencies:
            return "React"
        if "@angular/core" in dependencies:
            return "Angular"
        if "vue" in dependencies:
            return "Vue"
        if "@nestjs/core" in dependencies:
            return "NestJS"
        if "express" in dependencies:
            return "Express"

        # 2. Python backend framework checks
        requirements_path = os.path.join(base_path, "requirements.txt")
        pyproject_path = os.path.join(base_path, "pyproject.toml")
        
        py_libs = set()
        if os.path.exists(requirements_path):
            try:
                with open(requirements_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        parts = line.strip().split("==")
                        if parts:
                            py_libs.add(parts[0].lower())
            except Exception:
                pass

        if os.path.exists(pyproject_path):
            try:
                with open(pyproject_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    if "fastapi" in content: py_libs.add("fastapi")
                    if "django" in content: py_libs.add("django")
                    if "flask" in content: py_libs.add("flask")
            except Exception:
                pass

        if "fastapi" in py_libs or os.path.exists(os.path.join(base_path, "main.py")):
            return "FastAPI"
        if "django" in py_libs:
            return "Django"
        if "flask" in py_libs:
            return "Flask"

        # 3. Java checks
        if os.path.exists(os.path.join(base_path, "pom.xml")) or os.path.exists(os.path.join(base_path, "build.gradle")):
            # Check Spring Boot markers
            pom_path = os.path.join(base_path, "pom.xml")
            if os.path.exists(pom_path):
                try:
                    with open(pom_path, 'r', encoding='utf-8', errors='ignore') as f:
                        pom_content = f.read()
                        if "spring-boot" in pom_content:
                            return "Spring Boot"
                        if "spring-mvc" in pom_content:
                            return "Spring MVC"
                except Exception:
                    pass
            return "Java / Spring"

        # 4. PHP Laravel check
        if os.path.exists(os.path.join(base_path, "artisan")) or os.path.exists(os.path.join(base_path, "composer.json")):
            return "Laravel"

        # 5. .NET Check
        for file in os.listdir(base_path):
            if file.endswith(".csproj") or file.endswith(".sln"):
                return "ASP.NET / C#"

        # 6. Go Check
        if os.path.exists(os.path.join(base_path, "go.mod")):
            return "Go"

        # 7. Rust Check
        if os.path.exists(os.path.join(base_path, "Cargo.toml")):
            return "Rust"

        # Language-based fallbacks
        for root, dirs, files in os.walk(base_path):
            for file in files:
                if file.endswith(".py"):
                    return "Python"
                if file.endswith(".ts") or file.endswith(".tsx"):
                    return "TypeScript"
                if file.endswith(".js") or file.endswith(".jsx"):
                    return "JavaScript"
                if file.endswith(".java"):
                    return "Java"
                if file.endswith(".cpp") or file.endswith(".cc"):
                    return "C++"
                if file.endswith(".cs"):
                    return "C#"

        return "Unknown"
