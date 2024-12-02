// app/projects/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';

const ProjectPage = () => {
    const params = useParams();
    const id = params.id;

    return (
        <div>
            <h1>Viewing project ID: <b>{id}</b></h1>
        </div>
    );
};

export default ProjectPage;
