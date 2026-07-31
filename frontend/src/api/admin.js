import api from "./api";
import { fetchQuery } from "../utils/queryCache";

export function getAdminPage(path, config, options = {}) {
  return fetchQuery(
    `admin:page:${path}`,
    () => api.get(path, config).then(({ data }) => data),
    { staleTime: 60_000, ...options }
  ).then((data) => ({ data }));
}
