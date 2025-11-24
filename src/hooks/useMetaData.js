import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export const useMetaData = () => {
  const [majorOptions, setMajorOptions] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [certOptions, setCertOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [majors, jobs, skills, certs] = await Promise.all([
          apiClient.get('/meta/data/majors'),
          apiClient.get('/meta/data/jobs'),
          apiClient.get('/meta/data/skills'),
          apiClient.get('/meta/data/certifications')
        ]);

        // API returns string arrays, convert to { value, label } for react-select
        const toOption = (s) => ({ value: s, label: s });

        setMajorOptions(majors.data.map(toOption));
        setJobOptions(jobs.data.map(toOption));
        setSkillOptions(skills.data.map(toOption));
        setCertOptions(certs.data.map(toOption));
      } catch (error) {
        console.error("Failed to fetch metadata options", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return { majorOptions, jobOptions, skillOptions, certOptions, loading };
};

