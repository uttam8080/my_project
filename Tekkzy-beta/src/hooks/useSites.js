import { useCallback } from "react";
import { useApi } from "../context/ApiContext";

export const useSites = () => {
  const {
    userSites,
    isUserSitesLoading,
    userSitesError,
    listUserSites,
    deleteSite: deleteSiteApi,
  } = useApi();

  const refetch = useCallback(() => listUserSites(true), [listUserSites]);

  const deleteSite = useCallback(
    async (siteId) => {
      if (!siteId) {
        throw new Error("siteId is required");
      }
      return deleteSiteApi(siteId);
    },
    [deleteSiteApi],
  );

  return {
    sites: userSites,
    isLoading: isUserSitesLoading,
    error: userSitesError,
    refetch,
    deleteSite,
  };
};
