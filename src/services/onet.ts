const BASE_URL = 'https://api-v2.onetcenter.org';
const API_KEY = 'sKmBp-Jk05G-bmJzB-soNQQ';

export interface OnetCareer {
  code: string;
  title: string;
  href: string;
  tags: {
    bright_outlook?: boolean;
    green?: boolean;
    apprenticeship?: boolean;
  };
}

export interface OnetSearchResponse {
  start: number;
  end: number;
  total: number;
  career: OnetCareer[];
}

export async function searchCareers(keyword: string): Promise<OnetCareer[]> {
  try {
    const response = await fetch(`${BASE_URL}/mnm/search?keyword=${encodeURIComponent(keyword)}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error('O*NET API Error:', response.statusText);
      return [];
    }

    const data: OnetSearchResponse = await response.json();
    return data.career || [];
  } catch (error) {
    console.error('Failed to fetch from O*NET:', error);
    return [];
  }
}

export interface OnetQuestion {
  index: number;
  area: string;
  text: string;
}

export interface OnetQuestionsResponse {
  start: number;
  end: number;
  total: number;
  question: OnetQuestion[];
}

export interface RiasecArea {
  score: number;
  description: string;
  title: string;
}

export interface RiasecScoreWithDetails {
  realistic: RiasecArea;
  investigative: RiasecArea;
  artistic: RiasecArea;
  social: RiasecArea;
  enterprising: RiasecArea;
  conventional: RiasecArea;
}

export interface OnetResultResponse {
  result: {
    code: string;
    title: string;
    score: number;
    description: string;
  }[];
}

export async function getInterestProfilerQuestions(
  start: number = 1,
  end: number = 60
): Promise<OnetQuestion[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/mnm/interestprofiler/questions?start=${start}&end=${end}`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('O*NET API Error:', response.statusText);
      return [];
    }

    const data: OnetQuestionsResponse = await response.json();
    return data.question || [];
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return [];
  }
}

export async function getInterestProfilerResults(
  answers: string
): Promise<RiasecScoreWithDetails | null> {
  try {
    const response = await fetch(`${BASE_URL}/mnm/interestprofiler/results?answers=${answers}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error('O*NET API Error:', response.statusText);
      return null;
    }

    const data: OnetResultResponse = await response.json();

    // Convert array to object
    const scores: any = {};
    data.result.forEach((r) => {
      scores[r.code] = {
        score: r.score,
        description: r.description,
        title: r.title,
      };
    });

    return scores as RiasecScoreWithDetails;
  } catch (error) {
    console.error('Failed to fetch results:', error);
    return null;
  }
}

export interface OnetCareerDetails {
  code: string;
  title: string;
  tags: {
    bright_outlook?: boolean;
    green?: boolean;
    apprenticeship?: boolean;
  };
  what_they_do: string;
  on_the_job: string[];
  also_called?: { title: string; summary: boolean }[];
  salary?: {
    annual_median: number;
    hourly_median: number;
  };
  skills?: string[];
}

export async function getCareerDetails(code: string): Promise<OnetCareerDetails | null> {
  try {
    const [careerRes, outlookRes, skillsRes] = await Promise.all([
      fetch(`${BASE_URL}/mnm/careers/${code}`, { headers: { 'X-API-Key': API_KEY } }),
      fetch(`${BASE_URL}/mnm/careers/${code}/job_outlook`, { headers: { 'X-API-Key': API_KEY } }),
      fetch(`${BASE_URL}/mnm/careers/${code}/skills`, { headers: { 'X-API-Key': API_KEY } }),
    ]);

    if (!careerRes.ok) {
      console.error('O*NET API Error (Career):', careerRes.statusText);
      return null;
    }

    const careerData = await careerRes.json();
    let salaryData = undefined;
    let skillsData = undefined;

    if (outlookRes.ok) {
      const outlook = await outlookRes.json();
      if (outlook.salary) {
        salaryData = {
          annual_median: outlook.salary.annual_median,
          hourly_median: outlook.salary.hourly_median,
        };
      }
    }

    if (skillsRes.ok) {
      const skills = await skillsRes.json();
      if (skills.element) {
        skillsData = skills.element.map((s: any) => s.name).slice(0, 5); // Top 5 skills
      }
    }

    return {
      ...careerData,
      salary: salaryData,
      skills: skillsData,
    };
  } catch (error) {
    console.error('Failed to fetch career details:', error);
    return null;
  }
}

export interface OnetCareerMatch extends OnetCareer {
  fit: number;
}

export interface OnetCareersResponse {
  start: number;
  end: number;
  total: number;
  career: OnetCareerMatch[];
}

export async function getInterestProfilerCareers(
  scores: RiasecScoreWithDetails
): Promise<OnetCareerMatch[]> {
  try {
    const queryParams = new URLSearchParams({
      realistic: scores.realistic.score.toString(),
      investigative: scores.investigative.score.toString(),
      artistic: scores.artistic.score.toString(),
      social: scores.social.score.toString(),
      enterprising: scores.enterprising.score.toString(),
      conventional: scores.conventional.score.toString(),
    });

    const response = await fetch(
      `${BASE_URL}/mnm/interestprofiler/careers?${queryParams.toString()}`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('O*NET API Error:', response.statusText);
      return [];
    }

    const data: OnetCareersResponse = await response.json();
    return data.career || [];
  } catch (error) {
    console.error('Failed to fetch careers:', error);
    return [];
  }
}
