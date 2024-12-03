// app/projects/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';

const ProjectPage = () => {
    const params = useParams();
    const id = params.id;

    return (
        <div className='w-full min-h-full flex flex-col'>
            <p>Homepage for id: {id}</p>
        </div>
    );
};

export default ProjectPage;
