import * as React from "react";
import Projects from "./components/Projects";
import Tasks from "./components/Tasks";
import { ProjectProvider } from "./store/ProjectContext";

export function App() {
  return (
    <ProjectProvider>
      <div className="app-container">
        <div className="sidebar">
          <Projects />
        </div>
        <div className="main-content">
          <Tasks />
        </div>
        <style jsx>{`
          .app-container {
            display: flex;
            height: calc(100vh - 60px);
            width: 100%;
            background-color: #f9fafb;
          }
          .sidebar {
            width: 33.333%;
            height: 100%;
            overflow-y: auto;
            border-right: 1px solid #e2e8f0;
          }
          .main-content {
            width: 66.667%;
            height: 100%;
            overflow-y: auto;
          }
        `}</style>
      </div>
    </ProjectProvider>
  );
}