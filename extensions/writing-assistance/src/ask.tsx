import { ActionPanel, Action, List, LocalStorage, Toast, showToast, getPreferenceValues } from "@raycast/api";
import { usePromise, useCachedState } from "@raycast/utils";
import { fetchModels, fetchCompletions } from "./api/openRouter";
import { OpenRouterModel } from "./types";
import { useState } from "react";

interface Preferences {
  openRouterApiKey: string;
}

export default function Ask() {
  const { openRouterApiKey } = getPreferenceValues<Preferences>();
  const [selectedModel, setSelectedModel] = useCachedState<string>("selected_model");
  const [query, setQuery] = useState<string>("");
  const [completion, setCompletion] = useState<string>("");

  const { data: models, isLoading: isLoadingModels } = usePromise(async () => {
    const cachedModels = await LocalStorage.getItem<string>("cached_models");
    if (cachedModels) {
      return JSON.parse(cachedModels) as OpenRouterModel[];
    }
    const fetchedModels = await fetchModels();
    await LocalStorage.setItem("cached_models", JSON.stringify(fetchedModels));
    return fetchedModels;
  }, []);

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    await LocalStorage.setItem("selected_model", modelId);
  };

  const handleSubmit = async () => {
    if (!openRouterApiKey) {
      await showToast({
        style: Toast.Style.Failure,
        title: "API Key Missing",
        message: "Please add your API key in the extension's preferences.",
      });
      return;
    }

    if (!query || !selectedModel) return;

    try {
      const result = await fetchCompletions(query, selectedModel);
      setCompletion(result);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Invalid API Key",
            message: "Please check your preferences.",
          });
        } else if (errorMessage.includes("network")) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Network Error",
            message: "Please check your internet connection.",
          });
        } else {
          await showToast({
            style: Toast.Style.Failure,
            title: "API Error",
            message: "Failed to get completion from OpenRouter.",
          });
        }
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: "An unknown error occurred.",
        });
      }
      setCompletion("");
    }
  };

  if (completion) {
    return (
      <List>
        <List.Item title="Completion Result" subtitle={completion} />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoadingModels}
      searchText={query}
      onSearchTextChange={setQuery}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Model"
          value={selectedModel}
          onChange={handleModelChange}
        >
          {models?.map((model) => (
            <List.Dropdown.Item
              key={model.id}
              title={model.name}
              value={model.id}
            />
          ))}
        </List.Dropdown>
      }
    >
      {models?.map((model) => (
        <List.Item
          key={model.id}
          title={model.name}
          subtitle={model.description}
          accessories={[{ text: `Context: ${model.context_length}` }]}
          actions={
            <ActionPanel>
              <Action title="Submit Query" onAction={handleSubmit} />
              <Action.CopyToClipboard
                title="Copy Model ID"
                content={model.id}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}