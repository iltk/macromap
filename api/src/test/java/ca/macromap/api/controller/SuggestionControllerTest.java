package ca.macromap.api.controller;

import ca.macromap.api.dto.SuggestionResponse;
import ca.macromap.api.suggest.Remaining;
import ca.macromap.api.suggest.SuggestionQuery;
import ca.macromap.api.suggest.SuggestionService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SuggestionController.class)
class SuggestionControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    SuggestionService service;

    @Test
    void parsesRemainingMacrosAllergensAndPosition() throws Exception {
        when(service.suggest(any())).thenReturn(new SuggestionResponse(List.of(), List.of()));

        mvc.perform(get("/api/suggestions")
                        .param("calories", "700").param("protein", "45.5").param("fat", "30")
                        .param("avoid", "Milk, egg,,").param("lat", "43.65").param("lng", "-79.38")
                        .param("radiusKm", "999").param("limit", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.combos").isArray());

        ArgumentCaptor<SuggestionQuery> q = ArgumentCaptor.forClass(SuggestionQuery.class);
        verify(service).suggest(q.capture());
        assertThat(q.getValue().remaining()).isEqualTo(new Remaining(700, 45.5, null, 30.0));
        assertThat(q.getValue().avoid()).isEqualTo(Set.of("milk", "egg"));
        assertThat(q.getValue().lat()).isEqualTo(43.65);
        assertThat(q.getValue().radiusKm()).isEqualTo(50);   // clamped
        assertThat(q.getValue().limit()).isEqualTo(30);      // clamped
        assertThat(q.getValue().slug()).isNull();
    }
}
